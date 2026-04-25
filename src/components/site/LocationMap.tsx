interface LocationMapProps {
  className?: string;
  height?: string;
}

export function LocationMap({ className, height = "320px" }: LocationMapProps) {
  return (
    <div
      className={className}
      style={{
        width: "100%",
        height,
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      <iframe
        title="Blissful Place Residences location"
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d400!2d3.279664971163975!3d6.677627599999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwNDAnMzkuNSJOIDPCsDE2JzQ2LjgiRQ!5e0!3m2!1sen!2sng!4v1700000000000!5m2!1sen!2sng"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
