import logging
import platform

logger = logging.getLogger(__name__)

class LenelDataConduITService:
    def __init__(self, server_address: str = "localhost", namespace: str = "root\\OnGuard"):
        self.server_address = server_address
        self.namespace = namespace
        self.is_windows = platform.system() == "Windows"

        if self.is_windows:
            try:
                import wmi
                self.wmi_client = wmi.WMI(computer=self.server_address, namespace=self.namespace)
                logger.info(f"Connected to Lenel WMI at {self.server_address}\\{self.namespace}")
            except Exception as e:
                logger.error(f"Failed to connect to Lenel WMI: {e}")
                self.wmi_client = None
        else:
            logger.warning("Not running on Windows. Lenel WMI integration is mocked.")
            self.wmi_client = None

    def create_cardholder(self, visitor_data: dict) -> str:
        """
        Creates a cardholder in Lenel OnGuard using DataConduIT WMI.
        visitor_data: dictionary containing visitor information
        Returns: The newly created Cardholder ID (EmpID) or a mock ID.
        """
        if not self.is_windows or not self.wmi_client:
            # Mock behavior for development
            mock_id = f"MOCK_LNL_{visitor_data.get('national_id', '0000')}"
            logger.info(f"[MOCK] Created Lenel Cardholder: {visitor_data.get('name')} with ID {mock_id}")
            return mock_id

        try:
            # Windows/Lenel specific WMI class for Cardholder
            # Refer to Lenel DataConduIT Programmer's Guide for exact class names.
            # Typically it is Lnl_Cardholder
            new_cardholder = self.wmi_client.Lnl_Cardholder.new()
            new_cardholder.FirstName = visitor_data.get("name", "").split(" ")[0]
            new_cardholder.LastName = " ".join(visitor_data.get("name", "").split(" ")[1:])
            new_cardholder.SSN = visitor_data.get("national_id", "")
            # Add other mappings as per Lenel documentation

            # Save the cardholder
            new_cardholder.Put_()
            logger.info(f"Successfully created Lenel Cardholder: {visitor_data.get('name')}")

            # Retrieve generated ID
            return new_cardholder.ID
        except Exception as e:
            logger.error(f"Error creating Cardholder in Lenel: {e}")
            raise

    def fetch_all_access_levels(self) -> list:
        """
        Fetches all available access levels from Lenel DataConduIT.
        """
        if not self.is_windows or not self.wmi_client:
            # Mock Data
            return [
                {"lenel_id": "LNL_1001", "name": "General Employee", "description": "All non-restricted areas"},
                {"lenel_id": "LNL_1002", "name": "Executive VIP", "description": "Executive suites access"},
                {"lenel_id": "LNL_1003", "name": "IT Server Room", "description": "IT Staff Only"},
                {"lenel_id": "LNL_1004", "name": "Contractor", "description": "Temporary restricted access"},
            ]

        try:
            # Use WMI to fetch Lnl_AccessLevel instances
            access_levels = self.wmi_client.Lnl_AccessLevel()
            results = []
            for al in access_levels:
                results.append({
                    "lenel_id": str(al.ID),
                    "name": al.Name,
                    "description": getattr(al, "Description", "")
                })
            return results
        except Exception as e:
            logger.error(f"Error fetching access levels from Lenel: {e}")
            raise

    def assign_access_level(self, cardholder_id: str, access_level_id: str) -> bool:
        """
        Assigns an access level badge to a cardholder.
        """
        if not self.is_windows or not self.wmi_client:
            logger.info(f"[MOCK] Assigned Access Level {access_level_id} to Cardholder {cardholder_id}")
            return True

        try:
            # Typical flow:
            # 1. Create Lnl_Badge for the Cardholder
            # 2. Assign Lnl_AccessLevel to the Lnl_Badge

            # Creating a badge
            new_badge = self.wmi_client.Lnl_Badge.new()
            new_badge.PersonID = cardholder_id
            new_badge.Status = 1 # Active
            new_badge.Put_()

            # Linking access level
            badge_access = self.wmi_client.Lnl_BadgeAccessLevel.new()
            badge_access.BadgeID = new_badge.ID
            badge_access.AccessLevelID = access_level_id
            badge_access.Put_()

            return True
        except Exception as e:
            logger.error(f"Error assigning access level in Lenel: {e}")
            raise