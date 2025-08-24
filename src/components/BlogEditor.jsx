import React, { useState, useRef, useCallback, useEffect } from "react";
import ReactQuill from "react-quill";
import TurndownService from "turndown";
import "react-quill/dist/quill.snow.css";
import Quill from "quill";
import ImageResize from "quill-image-resize-module-react";

// Registrar módulo de imagen
Quill.register("modules/imageResize", ImageResize);

export default function BlogEditor() {
  const [content, setContent] = useState("");
  const [savedHtml, setSavedHtml] = useState("");
  const quillRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsReady(true);
    }
  }, []);

  // Función para subir imágenes
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "preset_publico"); // tu preset público
    formData.append("folder", "imagenes-blog"); // carpeta en Cloudinary

    try {
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dqbdcwefp/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );
      if (!response.ok) throw new Error("Error subiendo la imagen");
      const data = await response.json();
      return data.secure_url; // URL HTTPS lista para insertar
    } catch (error) {
      console.error("Error en uploadImage:", error);
      alert("No se pudo subir la imagen");
      return null;
    }
  };


  // Handler para insertar imágenes
  const imageHandler = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (file && quillRef.current) {
        const url = await uploadImage(file);
        if (url) {
          const editor = quillRef.current.getEditor();
          const range = editor.getSelection() || { index: editor.getLength() };
          editor.insertEmbed(range.index, "image", url);
        }
      }
    };
  }, []);

  // Toolbar y módulos
  const modules = isReady
    ? {
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ align: [] }], // Permite alinear texto
          ["link", "image"],
          ["clean"],
        ],
        handlers: { image: imageHandler },
      },
      imageResize: { modules: ["Resize", "DisplaySize"] },
    }
    : {};

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "link",
    "image",
    "align",
  ];

  const cleanHtml = (html) => {
    return html.replace(/<p><br><\/p>/g, "<br>");
  };


  // Guardar post y generar markdown
  const handleSave = () => {
    const turndownService = new TurndownService();
    const markdown = turndownService.turndown(content);

    const cleanedHtml = cleanHtml(content); // <-- limpia los <p><br></p>
    setSavedHtml(cleanedHtml);

    console.log("HTML Guardado:\n", content);
    console.log("HTML Limpio:\n", cleanedHtml);
    console.log("Markdown (para referencia futura):\n", markdown);
  };


  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "auto" }}>
      <h2>Editor de Post</h2>
      {isReady ? (
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={content}
          onChange={setContent}
          modules={modules}
          formats={formats}
          placeholder="Escribe tu post aquí..."
        />
      ) : (
        <p>Cargando editor...</p>
      )}

      <button
        onClick={handleSave}
        style={{
          marginTop: "10px",
          padding: "10px 20px",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Guardar Post
      </button>

      {savedHtml && (
        <div style={{ marginTop: "40px" }}>
          <h3>Vista previa HTML</h3>
          <div
            className="blog-preview"
            style={{
              border: "1px solid #ccc",
              borderRadius: "5px",
              padding: "15px",
            }}
            dangerouslySetInnerHTML={{ __html: savedHtml }}
          ></div>
        </div>
      )}

      {/* Estilos para la vista previa */}
      <style>{`
        .blog-preview .ql-align-center {
          text-align: center;
        }

        .blog-preview .ql-align-right {
          text-align: right;
        }

        .blog-preview .ql-align-left {
          text-align: left;
        }

        .blog-preview .ql-align-justify {
          text-align: justify;
        }

        /* Opcional: imágenes siguen con centrado automático si quieres */
        .blog-preview .ql-align-center img {
          display: block;
          margin: 0 auto;
        }

        .blog-preview .ql-align-right img {
          display: block;
          margin-left: auto;
          margin-right: 0;
        }

        .blog-preview .ql-align-left img {
          display: block;
          margin-left: 0;
          margin-right: auto;
        }

      `}</style>
    </div>
  );
}
