// @ts-nocheck
import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";

import { Button } from "@/components/ui/button";

export default function ExportButton({ targetRef, fileName }) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    if (!targetRef?.current) {
      return;
    }

    setExporting(true);

    try {
      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const link = document.createElement("a");
      link.download = `${fileName || "escala"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setExporting(false);
    }
  }

  return (
    <Button
      className="gap-2"
      disabled={exporting}
      onClick={handleExport}
      variant="outline"
    >
      {exporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      Exportar imagem
    </Button>
  );
}
