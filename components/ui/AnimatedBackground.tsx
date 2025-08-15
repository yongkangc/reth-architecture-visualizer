"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      radius: number
      color: string
      opacity: number
    }> = []

    // Create floating particles
    for (let i = 0; i < 20; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
        color: ["#627eea", "#a16ae8", "#ff8867"][Math.floor(Math.random() * 3)],
        opacity: Math.random() * 0.3 + 0.1
      })
    }

    const animate = () => {
      ctx.fillStyle = "rgba(20, 20, 20, 0.05)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      particles.forEach(particle => {
        particle.x += particle.vx
        particle.y += particle.vy

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1

        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        ctx.fillStyle = particle.color
        ctx.globalAlpha = particle.opacity
        ctx.fill()
        ctx.globalAlpha = 1
      })

      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <>
      <canvas 
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none opacity-40"
        style={{ zIndex: 0 }}
      />
      
      {/* Animated gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
        <motion.div
          className="absolute -top-40 -left-40 w-80 h-80 bg-[#627eea] rounded-full filter blur-[128px] opacity-30"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/2 -right-40 w-96 h-96 bg-[#a16ae8] rounded-full filter blur-[128px] opacity-25"
          animate={{
            x: [0, -150, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5
          }}
        />
        <motion.div
          className="absolute -bottom-40 left-1/3 w-72 h-72 bg-[#ff8867] rounded-full filter blur-[128px] opacity-20"
          animate={{
            x: [0, 50, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 10
          }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{ 
          zIndex: 2,
          backgroundImage: `linear-gradient(0deg, transparent 24%, rgba(98, 126, 234, 0.05) 25%, rgba(98, 126, 234, 0.05) 26%, transparent 27%, transparent 74%, rgba(98, 126, 234, 0.05) 75%, rgba(98, 126, 234, 0.05) 76%, transparent 77%, transparent),
                           linear-gradient(90deg, transparent 24%, rgba(98, 126, 234, 0.05) 25%, rgba(98, 126, 234, 0.05) 26%, transparent 27%, transparent 74%, rgba(98, 126, 234, 0.05) 75%, rgba(98, 126, 234, 0.05) 76%, transparent 77%, transparent)`,
          backgroundSize: '50px 50px'
        }}
      />
    </>
  )
}