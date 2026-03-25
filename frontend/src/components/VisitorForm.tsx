import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Upload } from 'lucide-react';

interface AccessLevel {
  id: number;
  lenel_id: string;
  name: string;
  description: string;
}

export default function VisitorForm() {
  const { t } = useTranslation();
  const [accessLevels, setAccessLevels] = useState<AccessLevel[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    guest_of: '',
    national_id: '',
    office_branch: '',
    start_time: '',
    end_time: '',
    address: '',
    nationality: '',
    car_plate: '',
    car_model: '',
    purpose_of_visit: '',
    passport_id: '',
    comments: '',
    selected_access_level_id: ''
  });

  useEffect(() => {
    // Fetch Access Levels from Lenel mock
    axios.get('http://localhost:8000/api/access-levels')
      .then(res => setAccessLevels(res.data))
      .catch(err => console.error("Could not load access levels:", err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsScanning(true);
    setMessage(null);
    const file = e.target.files[0];
    const formDataObj = new FormData();
    formDataObj.append("file", file);

    try {
      const response = await axios.post('http://localhost:8000/api/scan', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        const ocrData = response.data.data;
        setFormData(prev => ({
          ...prev,
          name: ocrData.name || prev.name,
          national_id: ocrData.national_id || prev.national_id,
          address: ocrData.address || prev.address,
          nationality: ocrData.nationality || prev.nationality,
          passport_id: ocrData.passport_id || prev.passport_id,
          car_plate: ocrData.car_plate || prev.car_plate,
        }));
        setMessage({ type: 'success', text: t('scanSuccess') });
      } else {
        setMessage({ type: 'error', text: t('scanError') });
      }
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: t('scanError') });
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    // Ensure dates format to ISO
    const payload = { ...formData };
    if (payload.start_time) payload.start_time = new Date(payload.start_time).toISOString();
    if (payload.end_time) payload.end_time = new Date(payload.end_time).toISOString();

    try {
      await axios.post('http://localhost:8000/api/visitors', payload);
      setMessage({ type: 'success', text: t('submitSuccess') });
      // Clear form
      setFormData({
        name: '', guest_of: '', national_id: '', office_branch: '',
        start_time: '', end_time: '', address: '', nationality: '',
        car_plate: '', car_model: '', purpose_of_visit: '', passport_id: '',
        comments: '', selected_access_level_id: ''
      });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: t('submitError') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md mt-6">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">{t('appTitle')}</h2>

        <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded shadow transition flex items-center gap-2">
          <Upload size={20} />
          {isScanning ? 'Scanning...' : t('scanID')}
          <input type="file" className="hidden" accept="image/*" onChange={handleScan} />
        </label>
      </div>

      {message && (
        <div className={`p-4 mb-6 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Mandatory Fields Section */}
        <section>
          <h3 className="text-xl font-semibold text-gray-700 mb-4">{t('form.mandatoryFields')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('form.name')} *</label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('form.nationalId')} *</label>
              <input required type="text" name="national_id" value={formData.national_id} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('form.guestOf')} *</label>
              <input required type="text" name="guest_of" value={formData.guest_of} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('form.officeBranch')} *</label>
              <input required type="text" name="office_branch" value={formData.office_branch} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('form.startTime')} *</label>
              <input required type="datetime-local" name="start_time" value={formData.start_time} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('form.endTime')} *</label>
              <input required type="datetime-local" name="end_time" value={formData.end_time} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
          </div>
        </section>

        {/* Access Level (Lenel) Section */}
        <section className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <label className="block text-sm font-semibold text-blue-900 mb-2">{t('form.accessLevel')} *</label>
          <select required name="selected_access_level_id" value={formData.selected_access_level_id} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white">
            <option value="" disabled>--- Select Lenel Access Level ---</option>
            {accessLevels.map(lvl => (
              <option key={lvl.id} value={lvl.lenel_id}>{lvl.name} ({lvl.description})</option>
            ))}
          </select>
        </section>

        {/* Optional Fields Section */}
        <section>
          <h3 className="text-xl font-semibold text-gray-700 mb-4 border-t pt-4">{t('form.optionalFields')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('form.address')}</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('form.nationality')}</label>
              <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('form.passportId')}</label>
              <input type="text" name="passport_id" value={formData.passport_id} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('form.purpose')}</label>
              <input type="text" name="purpose_of_visit" value={formData.purpose_of_visit} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('form.carPlate')}</label>
              <input type="text" name="car_plate" value={formData.car_plate} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('form.carModel')}</label>
              <input type="text" name="car_model" value={formData.car_model} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
          </div>
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700">{t('form.comments')}</label>
            <textarea name="comments" value={formData.comments} onChange={handleChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
        </section>

        <div className="flex justify-end pt-4 border-t">
          <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded shadow-lg disabled:opacity-50">
            {isSubmitting ? t('submitting') : t('submit')}
          </button>
        </div>
      </form>
    </div>
  );
}