'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Save, ShieldCheck, AlertCircle, User } from 'lucide-react'
import Turnstile from "react-turnstile"
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [captchaToken, setCaptchaToken] = useState<string | null>(null)
    
    // Data Profile
    const [profile, setProfile] = useState({
        fullname: '',
        role: '',
        email: '',
    })

    // Form Password
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    const [strength, setStrength] = useState(0)
    const [message, setMessage] = useState({ type: '', text: '' })

    // Fetch Data
    useEffect(() => {
        const getData = async () => {
            try {
                setLoading(true)
                const { data: { user }, error: authError } = await supabase.auth.getUser()
                if (authError || !user) throw authError

                const { data: profileData } = await supabase
                    .schema('glory')
                    .from('profiles')
                    .select('full_name, role')
                    .eq('id', user.id)
                    .single()

                setProfile({
                    email: user.email || '',
                    fullname: profileData?.full_name || '',
                    role: profileData?.role || 'User',
                })
            } catch (error) {
                console.error('Error:', error)
            } finally {
                setLoading(false)
            }
        }
        getData()
    }, [supabase])

    // Logic Strength
    const checkStrength = (pass: string) => {
        let score = 0
        if (!pass) return score
        if (pass.length > 7) score++
        if (/[A-Z]/.test(pass)) score++
        if (/[0-9]/.test(pass)) score++
        if (/[^A-Za-z0-9]/.test(pass)) score++
        return score
    }

    const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setPasswordForm({ ...passwordForm, newPassword: val })
        setStrength(checkStrength(val))
    }

    // Update Password Logic
    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage({ type: '', text: '' })

        if (!passwordForm.oldPassword) {
            setMessage({ type: 'error', text: 'Isi password lama dulu ngab.' })
            return
        }
        if (!captchaToken) {
            setMessage({ type: 'error', text: 'Captcha belum dicentang.' })
            return
        }
        if (strength < 2) {
            setMessage({ type: 'error', text: 'Password barunya lemes banget.' })
            return
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setMessage({ type: 'error', text: 'Password baru gak match.' })
            return
        }

        try {
            setUpdating(true)

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: profile.email,
                password: passwordForm.oldPassword,
                options: { captchaToken: captchaToken }
            })

            if (signInError) {
                setCaptchaToken(null)
                throw new Error('Password lama salah bos!')
            }

            const { error: updateError } = await supabase.auth.updateUser({
                password: passwordForm.newPassword
            })

            if (updateError) throw updateError

            setMessage({ type: 'success', text: 'Mantap! Password berhasil diganti.' })
            setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
            setStrength(0)
            setCaptchaToken(null)

        } catch (error) {
            console.log(error)
            setMessage({ type: 'error', text: "gagal update password"})
        } finally {
            setUpdating(false)
        }
    }

    const getStrengthColor = () => {
        if (strength === 0) return 'bg-gray-200 dark:bg-gray-700'
        if (strength < 2) return 'bg-red-500'
        if (strength < 4) return 'bg-yellow-500'
        return 'bg-green-500'
    }

    if (loading) return (
        <div className="flex h-screen justify-center items-center bg-gray-50 dark:bg-gray-950">
            <Loader2 className="animate-spin text-gray-500 dark:text-gray-400" />
        </div>
    )

    return (
        // Main Container: Support Dark Mode Background
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8 transition-colors duration-200">
            <div className="mx-auto max-w-2xl space-y-6">
                
                {/* Header */}
                <div className="flex items-center space-x-4 mb-6">
                    <button 
                        onClick={() => router.back()} 
                        className="rounded-full p-2 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                    >
                        <ArrowLeft className="h-6 w-6 text-gray-700 dark:text-gray-200" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Security & Profile</p>
                    </div>
                </div>

                {/* Profile Card */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 transition-colors duration-200">
                    <div className="flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
                        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Profile Info</h2>
                    </div>
                    
                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Nama Lengkap</label>
                            <div className="text-gray-900 dark:text-gray-100 font-medium mt-1">{profile.fullname}</div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Jabatan</label>
                            <div className="mt-1">
                                <span className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                                    {profile.role}
                                </span>
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</label>
                            <div className="text-gray-900 dark:text-gray-100 mt-1">{profile.email}</div>
                        </div>
                    </div>
                </div>

                {/* Password Form Card */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 transition-colors duration-200">
                    <div className="flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-gray-800 pb-2">
                        <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Ganti Password</h2>
                    </div>
                    
                    <form onSubmit={handleUpdatePassword} className="space-y-5">
                        
                        {/* Old Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password Lama</label>
                            <input
                                type="password"
                                value={passwordForm.oldPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent outline-none transition-all"
                                placeholder="Verifikasi password lama"
                            />
                        </div>

                        <hr className="border-gray-100 dark:border-gray-800" />

                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password Baru</label>
                            <input
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={handleNewPasswordChange}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                                placeholder="Ketik password baru"
                            />
                            {/* Strength Bar */}
                            {passwordForm.newPassword && (
                                <div className="mt-2 h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div className={`h-full transition-all duration-300 ${getStrengthColor()}`} style={{ width: `${(strength / 4) * 100}%` }} />
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Konfirmasi Password</label>
                            <input
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                                placeholder="Ulangi password baru"
                            />
                        </div>

                        {/* Turnstile / Captcha */}
                        <div className="flex justify-end">
                            {/* Theme 'auto' biar dia nyesuain sendiri sama browser */}
                            <Turnstile
                                sitekey={process.env.NEXT_PUBLIC_SITE_KEY_CAPTCHA || ''}
                                theme="auto" 
                                onVerify={(token) => setCaptchaToken(token)}
                                onError={() => setCaptchaToken(null)}
                                onExpire={() => setCaptchaToken(null)}
                            />
                        </div>

                        {/* Alert Messages */}
                        {message.text && (
                            <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
                                message.type === 'error' 
                                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' 
                                    : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                            }`}>
                                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <span>{message.text}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={updating || !captchaToken || !passwordForm.oldPassword}
                                className="flex items-center justify-center space-x-2 rounded-lg 
                                    bg-gray-900 hover:bg-gray-800 text-white 
                                    dark:bg-white dark:text-black dark:hover:bg-gray-200
                                    px-5 py-2.5 text-sm font-bold shadow-md 
                                    disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                            >
                                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                <span>Simpan Password</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}