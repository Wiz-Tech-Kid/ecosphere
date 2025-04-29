import React, { useState, ChangeEvent } from "react";
import { FiMail, FiDownload, FiTrash2, FiGlobe, FiShield } from "react-icons/fi";

const Settings: React.FC = () => {
  // Notifications
  const [notifications, setNotifications] = useState({ email: true, sms: false });
  const [savingNotifications, setSavingNotifications] = useState(false);

  // Language
  const [language, setLanguage] = useState("en");

  // Privacy Settings
  const [dataSharing, setDataSharing] = useState(false);

  // Handlers
  const handleNotificationChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setNotifications((prev) => ({ ...prev, [name]: checked }));
    setSavingNotifications(true);
    // simulate save
    await new Promise((r) => setTimeout(r, 500));
    setSavingNotifications(false);
  };

  const handleExportData = () => {
    alert("Data export initiated");
  };

  const handleDeleteAccount = () => {
    if (
      window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      alert("Account deletion initiated.");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto bg-[#021526] text-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-[#e1f5fe]">Settings</h1>

      {/* Language Settings */}
      <section className="bg-[#03346E] p-6 rounded-lg shadow-md space-y-4">
        <h2 className="text-xl font-semibold flex items-center space-x-2 text-[#e1f5fe]">
          <FiGlobe className="text-[#81d4fa]" />
          <span>Language</span>
        </h2>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full p-3 bg-[#021526] border border-[#1B262C] rounded-lg text-[#e1f5fe]"
        >
          <option value="en">English</option>
          <option value="fr">French</option>
          <option value="es">Spanish</option>
          <option value="de">German</option>
        </select>
      </section>

      {/* Notification Preferences */}
      <section className="bg-[#03346E] p-6 rounded-lg shadow-md space-y-4">
        <h2 className="text-xl font-semibold text-[#e1f5fe]">Notifications</h2>
        <label className="flex items-center justify-between text-[#81d4fa]">
          <span>Email Notifications</span>
          <input
            type="checkbox"
            name="email"
            checked={notifications.email}
            onChange={handleNotificationChange}
            className="toggle-input"
          />
        </label>
        <label className="flex items-center justify-between text-[#81d4fa]">
          <span>SMS Notifications</span>
          <input
            type="checkbox"
            name="sms"
            checked={notifications.sms}
            onChange={handleNotificationChange}
            className="toggle-input"
          />
        </label>
        {savingNotifications && <p className="text-sm text-[#81d4fa]">Saving...</p>}
      </section>

      {/* Privacy Settings */}
      <section className="bg-[#03346E] p-6 rounded-lg shadow-md space-y-4">
        <h2 className="text-xl font-semibold flex items-center space-x-2 text-[#e1f5fe]">
          <FiShield className="text-[#81d4fa]" />
          <span>Privacy Settings</span>
        </h2>
        <label className="flex items-center justify-between text-[#81d4fa]">
          <span>Enable Data Sharing</span>
          <input
            type="checkbox"
            checked={dataSharing}
            onChange={(e) => setDataSharing(e.target.checked)}
            className="toggle-input"
          />
        </label>
      </section>

      {/* Data Export */}
      <section className="bg-[#03346E] p-6 rounded-lg shadow-md flex justify-between items-center">
        <h2 className="text-xl font-semibold text-[#e1f5fe]">Data Export</h2>
        <button
          onClick={handleExportData}
          className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          <FiDownload />
          <span>Export Data</span>
        </button>
      </section>

      {/* Account Management */}
      <section className="bg-[#03346E] p-6 rounded-lg shadow-md flex justify-between items-center">
        <h2 className="text-xl font-semibold text-[#e1f5fe]">Account Management</h2>
        <button
          onClick={handleDeleteAccount}
          className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          <FiTrash2 />
          <span>Delete Account</span>
        </button>
      </section>
    </div>
  );
};

export default Settings;
