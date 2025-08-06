import { useState } from "react";

export default function Home() {
  const [ofxFile, setOfxFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const file = e.target.file.files[0];
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/convert", {
      method: "POST",
      body: formData,
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    setOfxFile(url);
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Conversor PDF → OFX</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" name="file" accept=".pdf" required />
        <button type="submit">Converter</button>
      </form>

      {ofxFile && (
        <a href={ofxFile} download="extrato.ofx">
          Baixar arquivo OFX
        </a>
      )}
    </div>
  );
}
