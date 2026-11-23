"use client";

import Image from "next/image";
import { useState } from "react";

export function ProfileAvatar() {
  const [hasPhoto, setHasPhoto] = useState(true);

  return (
    <span className="profile-avatar" role="img" aria-label="Vanessa Carla">
      {hasPhoto ? (
        <Image
          alt=""
          className="profile-avatar-image"
          height={48}
          onError={() => setHasPhoto(false)}
          priority
          src="/images/vanessa.jpg"
          unoptimized
          width={48}
        />
      ) : (
        <span aria-hidden="true" className="profile-avatar-fallback">VC</span>
      )}
    </span>
  );
}
