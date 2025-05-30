// src/app/profile-test/page.tsx
"use client";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { authApiClient } from "@/services/api";
import { UserResponseDto } from "@/types/user";
import { useEffect, useState } from "react";

export default function ProfileTestPage() {
    const [profile, setProfile] = useState<UserResponseDto | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const response = await authApiClient.get<UserResponseDto>('/auth/profile');
                setProfile(response.data);
                setError(null);
            } catch (err: any) {
                setError(err.response?.data?.message || err.message || "Failed to fetch profile");
                setProfile(null);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    return (
        <ProtectedRoute>
             <div className="min-h-screen bg-gray-900 text-white p-8">
                <h1 className="text-2xl font-bold mb-4">Profile Test Page</h1>
                {loading && <p>Loading profile...</p>}
                {error && <p className="text-red-500">Error: {error}</p>}
                {profile && (
                    <div>
                        <p>ID: {profile.id}</p>
                        <p>Email: {profile.email}</p>
                        <p>First Name: {profile.firstName}</p>
                        <p>Last Name: {profile.lastName}</p>
                        <p>Joined: {new Date(profile.createdAt).toLocaleDateString()}</p>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}