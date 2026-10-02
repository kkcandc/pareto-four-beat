"use client";

import { useEffect, useState } from "react";

export function Grain() {
  const [url, setUrl] = useState("");

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 140;
    canvas.height = 140;
    const context = canvas.getContext("2d");
    if (!context) return;
    const image = context.createImageData(140, 140);
    for (let index = 0; index < image.data.length; index += 4) {
      const value = 210 + Math.floor(Math.random() * 45);
      image.data[index] = value;
      image.data[index + 1] = value;
      image.data[index + 2] = value;
      image.data[index + 3] = 255;
    }
    context.putImageData(image, 0, 0);
    setUrl(canvas.toDataURL("image/png"));
  }, []);

  if (!url) return null;
  return <div className="grain" style={{ backgroundImage: `url(${url})` }} aria-hidden="true" />;
}
