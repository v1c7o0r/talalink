import React, { useState } from "react";
import SideBar from "../components/Layout/SideBar";

const initialUser = {
  id: 1,
  name: "John Artisan",
  email: "johnartisan@example.com",
  phone: "+254712345678",
  location: "Nairobi, Kenya",
  bio: "Experienced carpenter specializing in custom furniture and interior fittings.",
  profileImage:
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80",
};

const initialListings = [
  {
    id: 1,
    title: "Custom Wooden Chairs",
    category: "Furniture",
    price: "KES 4,500",
    status: "Active",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 2,
    title: "Modern Coffee Table",
    category: "Furniture",
    price: "KES 8,000",
    status: "Active",
    image:
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 3,
    title: "Office Desk Repair Service",
    category: "Repair",
    price: "KES 2,000",
    status: "Inactive",
    image:
      "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=600&q=80",
  },
];

export default function ProfilePage() {
  const [user, setUser] = useState(initialUser);
  const [listings, setListings] = useState(initialListings);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(user);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    setUser(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(user);
    setIsEditing(false);
  };

  const handleDeleteProfile = () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this profile? This action cannot be undone."
    );

    if (confirmed) {
      alert("Profile deleted successfully.");
      setUser(null);
      setListings([]);
    }
  };

  const handleDeleteListing = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this listing?"
    );

    if (confirmed) {
      setListings((prev) => prev.filter((listing) => listing.id !== id));
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen bg-[#0a1929] text-white">
        <SideBar isLoggedIn={true} />
        <main className="flex-1 p-6 md:p-10">
          <div className="mx-auto mt-20 max-w-md rounded-3xl border border-white/10 bg-[#132f4c] p-8 text-center shadow-2xl">
            <h1 className="mb-4 text-2xl font-bold text-[#66b2ff]">Profile Removed</h1>
            <p className="text-white/70">
              This artisan profile has been deleted.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0a1929] text-white">
      <SideBar isLoggedIn={true} />

      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="rounded-3xl border border-white/10 bg-[#132f4c] p-6 shadow-2xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              <div className="flex flex-col items-center lg:items-start">
                <img
                  src={user.profileImage}
                  alt={user.name}
                  className="h-32 w-32 rounded-full border-4 border-[#3399ff]/40 object-cover shadow-lg"
                />
              </div>

              <div className="flex-1">
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h1 className="text-3xl font-extrabold text-[#66b2ff]">
                      Artisan Profile
                    </h1>
                    <p className="mt-1 text-white/60">
                      View, edit, and manage your TalaLink account details
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleSave}
                          className="rounded-xl bg-green-600 px-4 py-2 font-semibold text-white transition hover:bg-green-700"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={handleCancel}
                          className="rounded-xl bg-slate-600 px-4 py-2 font-semibold text-white transition hover:bg-slate-700"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="rounded-xl bg-[#1976d2] px-4 py-2 font-semibold text-white transition hover:bg-[#1565c0]"
                        >
                          Edit Profile
                        </button>
                        <button
                          onClick={handleDeleteProfile}
                          className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700"
                        >
                          Delete Profile
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Full Name"
                      className="w-full rounded-xl border border-white/10 bg-[#0f2744] px-4 py-3 text-white placeholder:text-white/35 outline-none transition focus:border-[#3399ff] focus:ring-2 focus:ring-[#3399ff]/30"
                    />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Email"
                      className="w-full rounded-xl border border-white/10 bg-[#0f2744] px-4 py-3 text-white placeholder:text-white/35 outline-none transition focus:border-[#3399ff] focus:ring-2 focus:ring-[#3399ff]/30"
                    />
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Phone Number"
                      className="w-full rounded-xl border border-white/10 bg-[#0f2744] px-4 py-3 text-white placeholder:text-white/35 outline-none transition focus:border-[#3399ff] focus:ring-2 focus:ring-[#3399ff]/30"
                    />
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Location"
                      className="w-full rounded-xl border border-white/10 bg-[#0f2744] px-4 py-3 text-white placeholder:text-white/35 outline-none transition focus:border-[#3399ff] focus:ring-2 focus:ring-[#3399ff]/30"
                    />
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Bio"
                      rows="4"
                      className="md:col-span-2 w-full rounded-xl border border-white/10 bg-[#0f2744] px-4 py-3 text-white placeholder:text-white/35 outline-none transition focus:border-[#3399ff] focus:ring-2 focus:ring-[#3399ff]/30"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-[#0f2744] p-4">
                      <span className="block text-sm font-semibold text-[#66b2ff]">Name</span>
                      <span className="mt-1 block text-white/85">{user.name}</span>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#0f2744] p-4">
                      <span className="block text-sm font-semibold text-[#66b2ff]">Email</span>
                      <span className="mt-1 block text-white/85">{user.email}</span>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#0f2744] p-4">
                      <span className="block text-sm font-semibold text-[#66b2ff]">Phone</span>
                      <span className="mt-1 block text-white/85">{user.phone}</span>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#0f2744] p-4">
                      <span className="block text-sm font-semibold text-[#66b2ff]">Location</span>
                      <span className="mt-1 block text-white/85">{user.location}</span>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#0f2744] p-4 md:col-span-2">
                      <span className="block text-sm font-semibold text-[#66b2ff]">Bio</span>
                      <span className="mt-1 block text-white/85">{user.bio}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#132f4c] p-6 shadow-2xl">
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h2 className="text-2xl font-bold text-[#66b2ff]">My Listings</h2>
              <span className="text-sm text-white/60">
                {listings.length} listing{listings.length !== 1 ? "s" : ""}
              </span>
            </div>

            {listings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-[#0f2744] py-10 text-center text-white/50">
                No listings available.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {listings.map((listing) => (
                  <div
                    key={listing.id}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f2744] shadow-lg transition hover:-translate-y-1 hover:border-[#3399ff]/40"
                  >
                    <img
                      src={listing.image}
                      alt={listing.title}
                      className="h-48 w-full object-cover"
                    />

                    <div className="space-y-3 p-4">
                      <h3 className="text-lg font-semibold text-white">
                        {listing.title}
                      </h3>

                      <p className="text-sm text-white/65">
                        Category: {listing.category}
                      </p>

                      <p className="text-sm font-medium text-[#66b2ff]">
                        Price: {listing.price}
                      </p>

                      <p
                        className={`text-sm font-semibold ${
                          listing.status === "Active"
                            ? "text-green-400"
                            : "text-yellow-400"
                        }`}
                      >
                        {listing.status}
                      </p>

                      <div className="flex gap-2 pt-2">
                        <button className="flex-1 rounded-xl bg-[#1976d2] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#1565c0]">
                          View
                        </button>
                        <button className="flex-1 rounded-xl bg-slate-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteListing(listing.id)}
                          className="flex-1 rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}