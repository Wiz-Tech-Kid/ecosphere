import React, { useState } from "react";
import { FiUser, FiLock, FiKey, FiLink, FiX } from "react-icons/fi";
import supabase from "../utils/supabaseClient";

const Profile: React.FC = () => {
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john.doe@example.com");
  const [phone, setPhone] = useState("+1234567890");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSaveProfile = () => {
    alert("Profile updated successfully!");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setSuccessMessage("Password updated successfully!");
      setIsChangePasswordOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update password.");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto bg-[#021526] text-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-[#e1f5fe]">Profile</h1>

      {/* Personal Information */}
      <section className="bg-[#03346E] p-6 rounded-lg shadow-md space-y-4">
        <h2 className="text-xl font-semibold flex items-center space-x-2 text-[#e1f5fe]">
          <FiUser className="text-[#81d4fa]" />
          <span>Personal Information</span>
        </h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 bg-[#021526] border border-[#1B262C] rounded-lg text-[#e1f5fe]"
          placeholder="Name"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 bg-[#021526] border border-[#1B262C] rounded-lg text-[#e1f5fe]"
          placeholder="Email"
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full p-3 bg-[#021526] border border-[#1B262C] rounded-lg text-[#e1f5fe]"
          placeholder="Phone Number"
        />
        <button
          onClick={handleSaveProfile}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Save Changes
        </button>
      </section>

      {/* Change Password */}
      <section className="bg-[#03346E] p-6 rounded-lg shadow-md space-y-4">
        <h2 className="text-xl font-semibold flex items-center space-x-2 text-[#e1f5fe]">
          <FiLock className="text-[#81d4fa]" />
          <span>Change Password</span>
        </h2>
        <button
          onClick={() => setIsChangePasswordOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Change Password
        </button>
      </section>

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#021526] text-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button
              onClick={() => setIsChangePasswordOpen(false)}
              className="absolute top-4 right-4 text-[#81d4fa] hover:text-[#e1f5fe]"
            >
              <FiX className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-semibold mb-4 text-[#e1f5fe]">Change Password</h2>
            {errorMessage && <p className="text-red-500 text-sm mb-4">{errorMessage}</p>}
            {successMessage && <p className="text-green-500 text-sm mb-4">{successMessage}</p>}
            <form onSubmit={handleChangePassword} className="space-y-4">
              <input
                type="password"
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full p-3 bg-[#03346E] border border-[#1B262C] rounded-lg text-[#e1f5fe]"
                required
              />
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 bg-[#03346E] border border-[#1B262C] rounded-lg text-[#e1f5fe]"
                required
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 bg-[#03346E] border border-[#1B262C] rounded-lg text-[#e1f5fe]"
                required
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Two-Factor Authentication */}
      <section className="bg-[#03346E] p-6 rounded-lg shadow-md space-y-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center space-x-2 text-[#e1f5fe]">
            <FiKey className="text-[#81d4fa]" />
            <span>Two-Factor Authentication</span>
          </h2>
          <label className="flex items-center justify-between text-[#81d4fa]">
            <span>Enable Two-Factor Authentication</span>
            <input
              type="checkbox"
              checked={twoFactorEnabled}
              onChange={(e) => setTwoFactorEnabled(e.target.checked)}
              className="toggle-input"
            />
          </label>
        </div>
      </section>
    </div>
  );
};

export default Profile;
