"use client"
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function NotFound() {
  const [glitchActive, setGlitchActive] = useState(false)

  const [particles, setParticles] = useState<
  { left: number; top: number; duration: number; delay: number }[]
>([])

  useEffect(() => {

     setParticles(
    Array.from({ length: 20 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: 5 + Math.random() * 10,
      delay: Math.random() * 5
    }))
  )
    // Random glitch effect
    const interval = setInterval(() => {
      setGlitchActive(true)
      setTimeout(() => setGlitchActive(false), 200)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative min-h-screen bg-black overflow-hidden flex items-center justify-center p-4">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-black to-purple-950 opacity-80" />
      
      {/* Animated grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite'
        }} />
      </div>

      {/* Stars */}
      {particles.map((star, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            animationDelay: `${star.delay}s`
          }}
        />
      ))}

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-indigo-500 rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center space-y-8 max-w-2xl">
        {/* Glitch 404 */}
        <div className="relative">
          <h1 
            className={`text-[12rem] md:text-[16rem] font-black leading-none select-none ${
              glitchActive ? 'animate-glitch' : ''
            }`}
            style={{
              textShadow: glitchActive 
                ? '0.05em 0 0 rgba(255, 0, 0, 0.75), -0.025em -0.05em 0 rgba(0, 255, 0, 0.75), 0.025em 0.05em 0 rgba(0, 0, 255, 0.75)'
                : 'none'
            }}
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 animate-gradient">
              404
            </span>
          </h1>
          
          {/* Glitch layers */}
          {glitchActive && (
            <>
              <h1 className="absolute inset-0 text-[12rem] md:text-[16rem] font-black text-red-500 opacity-70 mix-blend-screen"
                style={{ transform: 'translate(-4px, -4px)' }}>
                404
              </h1>
              <h1 className="absolute inset-0 text-[12rem] md:text-[16rem] font-black text-cyan-500 opacity-70 mix-blend-screen"
                style={{ transform: 'translate(4px, 4px)' }}>
                404
              </h1>
            </>
          )}
        </div>

        {/* Scanline effect */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="h-full w-full animate-scan"
            style={{
              background: 'linear-gradient(transparent 50%, rgba(255, 255, 255, 0.1) 50%)',
              backgroundSize: '100% 4px'
            }}
          />
        </div>

        {/* Title */}
        <div className="space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            <span className="inline-block animate-fadeInUp">Lost</span>{' '}
            <span className="inline-block animate-fadeInUp" style={{ animationDelay: '0.1s' }}>in</span>{' '}
            <span className="inline-block animate-fadeInUp" style={{ animationDelay: '0.2s' }}>the</span>{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500 inline-block animate-fadeInUp" 
              style={{ animationDelay: '0.3s' }}>
              Void
            </span>
            <span className="inline-block animate-fadeInUp" style={{ animationDelay: '0.4s' }}>?</span>
          </h2>

          <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-md mx-auto animate-fadeInUp" 
            style={{ animationDelay: '0.5s' }}>
            Waduh, halaman yang di cari gak ada di <span className="text-indigo-400 font-semibold italic">realm</span> ini. 
            Mungkin udah dihapus atau lu salah ketik URLnya.
          </p>
        </div>

        {/* CTA Button */}
        <div className="pt-4 animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
          <Link 
            href="/"
            className="group relative inline-flex items-center gap-3 px-10 py-4 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-lg transition-all duration-300 shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:shadow-[0_0_50px_rgba(99,102,241,0.8)] hover:scale-105 overflow-hidden"
          >
            {/* Button shine effect */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-500 group-hover:animate-shimmer" />
            
            <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            
            <span className="relative">Balik ke Portal</span>
            
            {/* Glowing orbs */}
            <span className="absolute -right-1 -top-1 w-3 h-3 bg-pink-400 rounded-full animate-ping opacity-75" />
            <span className="absolute -right-1 -top-1 w-3 h-3 bg-pink-400 rounded-full" />
          </Link>
        </div>

        {/* Error code */}
        <p className="text-sm text-gray-600 font-mono animate-fadeInUp" style={{ animationDelay: '0.7s' }}>
          ERROR_CODE: <span className="text-indigo-400">DIMENSION_NOT_FOUND</span>
        </p>
      </div>

      {/* Custom animations styles */}
      <style jsx>{`
        @keyframes gridMove {
          0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
          100% { transform: perspective(500px) rotateX(60deg) translateY(50px); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-40px) translateX(-10px); }
          75% { transform: translateY(-20px) translateX(10px); }
        }

        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .animate-scan {
          animation: scan 8s linear infinite;
        }

        .animate-shimmer {
          animation: shimmer 2s ease-in-out;
        }

        .animate-glitch {
          animation: glitch 0.3s ease-in-out;
        }
      `}</style>
    </div>
  )
}