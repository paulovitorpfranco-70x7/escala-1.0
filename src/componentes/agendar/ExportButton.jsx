import { useState, useRef } from "react";
import { Download, Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";

export default function ExportButton({ targetRef, fileName }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!targetRef?.current) return;
    setExporting(true);
    
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
    
    setExporting(false);
  };

  return (
    <Button onClick={handleExport} disabled={exporting} variant="outline" className="gap-2">
      {exporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      Exportar Imagem
    </Button>
  );
}