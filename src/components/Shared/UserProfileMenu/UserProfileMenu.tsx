"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { SessionUser } from "@/types/auth";

type UserProfileMenuProps = {
  user: SessionUser;
};

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return email.slice(0, 2).toUpperCase();
}

export function UserProfileMenu({ user }: UserProfileMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const userInitials = useMemo(() => getInitials(user.name, user.email), [user.email, user.name]);
  const referenceId = useMemo(() => user.id.slice(-8).toUpperCase(), [user.id]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleLogout() {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/sign-out", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Sign out failed");
      }

      setIsOpen(false);
      router.push("/sign-in");
      router.refresh();
    } catch {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="profile-menu" ref={menuRef}>
      <button
        type="button"
        className="profile-menu-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <span className="profile-avatar" aria-hidden="true">
          {userInitials}
        </span>
        <span className="profile-text-block">
          <span className="profile-name">{user.name ?? user.email}</span>
          <span className="profile-reference">Ref. ID - {referenceId}</span>
        </span>
        <span className="profile-chevron" aria-hidden="true">
          ▾
        </span>
      </button>

      {isOpen ? (
        <div className="profile-menu-content" role="menu">
          <button
            type="button"
            className="profile-menu-item"
            onClick={handleLogout}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Logging out..." : "Log out"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
