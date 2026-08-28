// Аватар-монограмма со градиентом (статичные мокап-данные; фото приедут с бэкенда)
function Avatar({ name, hue, size = "md", ring = false }) {
  return (
    <span
      className={`avatar-dot avatar-dot--${size} ${ring ? "avatar-dot--ring" : ""}`}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 45% 30%), hsl(${hue} 55% 18%))`,
      }}
      aria-hidden="true"
    >
      {name.replace("You (", "").charAt(0).toUpperCase()}
    </span>
  );
}

export default Avatar;
