# Deployment Guide: High Availability & Scalability (100k+ Records)

This document outlines the recommended approach to deploying this Visitor Management System to support High Availability (HA) and scale to handle over 100,000+ historical records smoothly.

## 1. Database Layer (Microsoft SQL Server Always On)
Given the requirement for High Availability and the existing Windows Cluster environment, the backend data store should be migrated from SQLite to **Microsoft SQL Server with Always On Availability Groups**.

**Why MS SQL Server?**
- Native integration with Windows Server Failover Clustering (WSFC).
- High Availability via primary and secondary replica nodes.
- Excellent read/write performance for 100k+ records.

**Setup Instructions:**
1. Provision at least two Windows Server VMs in a Failover Cluster.
2. Install SQL Server and configure an Always On Availability Group.
3. Update the connection string in `backend/app/database.py`:
   ```python
   # Requires: pip install pyodbc
   SQLALCHEMY_DATABASE_URL = "mssql+pyodbc://username:password@AG_Listener_IP/VisitorDB?driver=ODBC+Driver+17+for+SQL+Server"
   ```
4. **Indexing Strategy**: To ensure the global search API remains fast for 100k records, create Non-Clustered Indexes on frequently searched columns (`name`, `national_id`, `car_plate`).

## 2. Backend Layer (Python FastAPI on Windows Server / IIS)
The backend is completely stateless (aside from WMI calls which communicate out), making it perfect for horizontal scaling.

**Why IIS and HttpPlatformHandler?**
- You already have a Windows Cluster.
- IIS can act as a reverse proxy, load balancing requests to multiple Python worker processes.
- FastAPI (Uvicorn) runs brilliantly behind IIS using the `HttpPlatformHandler` module.

**Setup Instructions:**
1. Install IIS and the HttpPlatformHandler extension on 2+ Windows Server nodes.
2. Clone the backend repository to `C:\inetpub\wwwroot\visitor-api`.
3. Set up the Python Virtual Environment and install dependencies (`requirements.txt`).
4. Create a `web.config` file in the root of the backend folder:
   ```xml
   <?xml version="1.0" encoding="utf-8"?>
   <configuration>
     <system.webServer>
       <handlers>
         <add name="PythonHandler" path="*" verb="*" modules="httpPlatformHandler" resourceType="Unspecified"/>
       </handlers>
       <httpPlatform processPath="C:\inetpub\wwwroot\visitor-api\venv\Scripts\python.exe"
                     arguments="-m uvicorn app.main:app --port %HTTP_PLATFORM_PORT%"
                     stdoutLogEnabled="true"
                     stdoutLogFile=".\logs\python.log"
                     startupTimeLimit="60">
       </httpPlatform>
     </system.webServer>
   </configuration>
   ```
5. Place an **F5 BIG-IP / Hardware Load Balancer** or Windows Network Load Balancing (NLB) in front of the IIS nodes to distribute incoming frontend API traffic evenly across the instances.

## 3. Frontend Layer (React / Vite)
The frontend is a static Single Page Application (SPA).

**Setup Instructions:**
1. Run `npm run build` locally or in a CI/CD pipeline (e.g., GitHub Actions, Azure DevOps).
2. The output in the `dist/` directory consists solely of static HTML, CSS, and JS files.
3. Host these files on a highly available static file server, such as:
   - Azure Blob Storage (Static Web Hosting) behind Azure CDN.
   - An AWS S3 bucket behind CloudFront.
   - Or, simply drop the `dist/` folder into another IIS site distributed across your cluster.

## 4. Single Point of Failure: DESKO & Lenel Hardware Integration
While the Web App and Database are highly available:
1. **DESKO Scanners:** Are physically tied to USB ports on reception desks. If a scanner breaks, the receptionist can manually enter the ID numbers as a fallback.
2. **Lenel DataConduIT:** WMI calls are made directly to the Lenel application server. If the Lenel primary server goes down, the Python backend must be configured to failover to a secondary Lenel node (if one exists). The API endpoints are designed to catch Lenel integration errors and gracefully mark the record as `is_synchronized = False` while allowing the local visitor record to be saved successfully. A background CRON job could be added later to retry failed syncs.