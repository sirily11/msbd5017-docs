'use client'

import React, { useRef, useEffect } from 'react'
import { X } from 'lucide-react'

interface FullscreenImageDialogProps {
  src: string
  alt: string
  className?: string
}

export default function FullscreenImageDialog({
  src,
  alt,
  className,
}: FullscreenImageDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  const openDialog = () => {
    if (dialogRef.current) {
      dialogRef.current.showModal()
    }
  }

  const closeDialog = () => {
    if (dialogRef.current) {
      dialogRef.current.close()
    }
  }

  useEffect(() => {
    const dialog = dialogRef.current

    const handleClickOutside = (event: MouseEvent) => {
      if (dialog && event.target === dialog) {
        closeDialog()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDialog()
      }
    }

    if (dialog) {
      dialog.addEventListener('click', handleClickOutside)
      dialog.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      if (dialog) {
        dialog.removeEventListener('click', handleClickOutside)
        dialog.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [])

  return (
    <>
      <img
        src={src}
        alt={alt}
        onClick={openDialog}
        className={`cursor-pointer transition-transform hover:scale-105 ${className}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            openDialog()
          }
        }}
        role="button"
        aria-haspopup="dialog"
      />
      <dialog
        ref={dialogRef}
        className="bg-transparent p-0 backdrop:bg-black backdrop:bg-opacity-75"
      >
        <div className="max-h-[90vh] max-w-[90vw] overflow-scroll">
          <img src={src} alt={alt} className="rounded-lg" />
        </div>
        <button
          onClick={closeDialog}
          className="absolute right-4 top-4 rounded-full bg-white bg-opacity-50 p-2 transition-colors hover:bg-opacity-100"
          aria-label="Close dialog"
        >
          <X />
        </button>
      </dialog>
    </>
  )
}
