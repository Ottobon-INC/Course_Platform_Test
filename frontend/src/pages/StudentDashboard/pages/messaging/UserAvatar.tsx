import type { MsgUser } from "./types";

interface UserAvatarProps {
  user?: MsgUser | { full_name?: string; email?: string; avatar_url?: string };
  size?: number;
}

export default function UserAvatar({ user, size = 32 }: UserAvatarProps) {
  const initials = (user?.full_name || user?.email || "?").charAt(0).toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: "50%",
        backgroundColor: "#e0e7ff",
        color: "#006BFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.38,
        userSelect: "none",
      }}
      title={user?.full_name || user?.email}
    >
      {initials}
    </div>
  );
}

