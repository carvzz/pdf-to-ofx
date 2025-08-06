import formidable from "formidable";
import fs from "fs";
import pdfParse from "pdf-parse";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const form = new formidable.IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).send("Erro no upload");

    const pdfPath = files.file[0].filepath;
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(dataBuffer);

    const linhas = pdfData.text.split("\n");
    const transacoes = [];

    for (let linha of linhas) {
      const partes = linha.trim().split(/\s+/);
      if (partes.length >= 3) {
        try {
          const data = partes[0].split("/").reverse().join("");
          const valor = partes[partes.length - 1].replace(",", ".");
          const desc = partes.slice(1, -1).join(" ");
          transacoes.push({ data, desc, valor });
        } catch {}
      }
    }

    let ofx = `<?xml version="1.0" encoding="UTF-8"?>
<OFX>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <TRNUID>1
      <STATUS>
        <CODE>0
        <SEVERITY>INFO
      </STATUS>
      <STMTRS>
        <CURDEF>BRL
        <BANKTRANLIST>`;

    for (let t of transacoes) {
      ofx += `
          <STMTTRN>
            <TRNTYPE>OTHER
            <DTPOSTED>${t.data}
            <TRNAMT>${t.valor}
            <FITID>${Math.random().toString(36).substr(2, 10)}
            <NAME>${t.desc}
          </STMTTRN>`;
    }

    ofx += `
        </BANKTRANLIST>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>`;

    res.setHeader("Content-Type", "application/ofx");
    res.setHeader("Content-Disposition", "attachment; filename=extrato.ofx");
    res.send(ofx);
  });
}
