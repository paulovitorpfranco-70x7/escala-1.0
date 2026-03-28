// @ts-nocheck
import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { sanitizeExportFileName } from "@/lib/exportUtils";

const EXPORT_SCROLL_SELECTOR = "[data-export-scroll]";
const EXPORT_TABLE_SELECTOR = "[data-export-table]";
const EXPORT_STICKY_SELECTOR = "[data-export-sticky]";

function waitForNextPaint() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(resolve);
    });
  });
}

function buildExportSandbox(target) {
  const sandbox = document.createElement("div");
  const sourceScrollContainer = target.querySelector(EXPORT_SCROLL_SELECTOR);
  const sourceWidth = Math.ceil(
    sourceScrollContainer?.scrollWidth ||
      target.scrollWidth ||
      target.getBoundingClientRect().width
  );

  Object.assign(sandbox.style, {
    position: "fixed",
    left: "-100000px",
    top: "0",
    padding: "24px",
    background: "#ffffff",
    pointerEvents: "none",
  });

  const clone = target.cloneNode(true);
  Object.assign(clone.style, {
    width: `${sourceWidth}px`,
    maxWidth: "none",
    overflow: "visible",
  });

  sandbox.appendChild(clone);
  document.body.appendChild(sandbox);

  const clonedScrollContainer = clone.querySelector(EXPORT_SCROLL_SELECTOR);
  if (clonedScrollContainer) {
    Object.assign(clonedScrollContainer.style, {
      overflow: "visible",
      width: `${sourceWidth}px`,
      maxWidth: "none",
    });
  }

  const clonedTable = clone.querySelector(EXPORT_TABLE_SELECTOR);
  if (clonedTable) {
    Object.assign(clonedTable.style, {
      width: `${sourceWidth}px`,
      minWidth: `${sourceWidth}px`,
    });
  }

  clone.querySelectorAll(EXPORT_STICKY_SELECTOR).forEach((element) => {
    Object.assign(element.style, {
      position: "static",
      left: "auto",
      right: "auto",
    });
  });

  return {
    sandbox,
    clone,
    width: Math.ceil(clone.scrollWidth || sourceWidth),
    height: Math.ceil(
      clone.scrollHeight ||
        target.scrollHeight ||
        target.getBoundingClientRect().height
    ),
  };
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Nao foi possivel gerar o arquivo da exportacao."));
        return;
      }

      resolve(blob);
    }, "image/png");
  });
}

function downloadBlob(blob, fileName) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${sanitizeExportFileName(fileName)}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 0);
}

export default function ExportButton({ targetRef, fileName }) {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  async function handleExport() {
    if (!targetRef?.current) {
      toast({
        title: "Nao foi possivel exportar",
        description: "A grade da escala ainda nao esta pronta para captura.",
        variant: "destructive",
      });
      return;
    }

    setExporting(true);
    let sandbox = null;

    try {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const exportTarget = buildExportSandbox(targetRef.current);
      sandbox = exportTarget.sandbox;

      await waitForNextPaint();

      const canvas = await html2canvas(exportTarget.clone, {
        backgroundColor: "#ffffff",
        scale: Math.min(Math.max(window.devicePixelRatio || 1, 2), 3),
        useCORS: true,
        logging: false,
        width: exportTarget.width,
        height: exportTarget.height,
        windowWidth: exportTarget.width,
        windowHeight: exportTarget.height,
        scrollX: 0,
        scrollY: 0,
      });

      const blob = await canvasToBlob(canvas);
      const sanitizedFileName = sanitizeExportFileName(fileName);
      downloadBlob(blob, sanitizedFileName);

      toast({
        title: "Imagem exportada",
        description: `Download iniciado: ${sanitizedFileName}.png`,
      });
    } catch (error) {
      toast({
        title: "Falha ao exportar imagem",
        description:
          error?.message ||
          "Nao foi possivel capturar a grade da escala neste momento.",
        variant: "destructive",
      });
    } finally {
      sandbox?.remove();
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
