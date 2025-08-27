import React, { useState, useRef, useCallback, useEffect } from "react";
import ReactQuill from "react-quill";
import TurndownService from "turndown";
import "react-quill/dist/quill.snow.css";
import Quill from "quill";
import ImageResize from "quill-image-resize-module-react";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import java from "highlight.js/lib/languages/java";
import csharp from "highlight.js/lib/languages/csharp";
import cpp from "highlight.js/lib/languages/cpp";
import htmlLang from "highlight.js/lib/languages/xml";
import cssLang from "highlight.js/lib/languages/css";

Quill.register("modules/imageResize", ImageResize);

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("java", java);
hljs.registerLanguage("csharp", csharp);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("html", htmlLang);
hljs.registerLanguage("css", cssLang);

export default function BlogEditor() {
  const [content, setContent] = useState("");
  const [savedHtml, setSavedHtml] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [showSizeSelector, setShowSizeSelector] = useState(false);
  const [customWidth, setCustomWidth] = useState("300");
  const [showLangSelector, setShowLangSelector] = useState(false);
  const [selectedRange, setSelectedRange] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");

  // PRUEBA BACKEND 
  const [showApiSelector, setShowApiSelector] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState("/api/test/users");
  const backendUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:8080"
      : "https://mi-backend.onrender.com";


  const endpoints = [
    { label: "Todos los usuarios", path: "/api/test/users" },
    { label: "Contraseña por ID (ejemplo: ID 1)", path: "/api/test/users/1/password" },
    { label: "Usuarios con contraseñas", path: "/api/test/users/userwithpassword" },
    { label: "Usuarios con posts (Mostrará HTML en vista previa)", path: "/api/test/users/with-posts-raw" },
  ];


  // prueba creacion post 
  // Nivel de clasificación del post
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [postLevel, setPostLevel] = useState("category"); // category | subcategory | element
  const [options, setOptions] = useState([]); // opciones cargadas
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [postTitle, setPostTitle] = useState("Post Prueba"); // valor inicial




  // Modal selección usuario/post
  const [showUserPostSelector, setShowUserPostSelector] = useState(false);
  const [usersForPreview, setUsersForPreview] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [postsForSelectedUser, setPostsForSelectedUser] = useState([]);

  // Llamar cuando cambia el nivel
  useEffect(() => {
    if (showCreatePostModal) {
      loadOptions(postLevel);
      setSelectedOptionId(null);
    }
  }, [postLevel, showCreatePostModal]);




  const quillRef = useRef(null);

  const languages = ["javascript", "java", "python", "csharp", "cpp", "html", "css", "jsx"];

  useEffect(() => {
    if (typeof window !== "undefined") setIsReady(true);
  }, []);

  // ---------- IMAGES ----------
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "preset_publico");
    formData.append("folder", "imagenes-blog");
    try {
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dqbdcwefp/image/upload",
        { method: "POST", body: formData }
      );
      if (!response.ok) throw new Error("Error subiendo la imagen");
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error(error);
      alert("No se pudo subir la imagen");
      return null;
    }
  };

  const imageHandler = useCallback(() => setShowSizeSelector(true), []);
  const handleSizeConfirm = useCallback(() => {
    setShowSizeSelector(false);
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
          const range = editor.getSelection(true) || { index: editor.getLength() };
          editor.insertEmbed(range.index, "image", url, "user");
          editor.formatText(range.index, 1, { width: `${customWidth}px`, height: "auto" });
        }
      }
    };
  }, [customWidth]);

  // ---------- CODE-BLOCK ----------
  const codeHandler = useCallback(() => {
    const editor = quillRef.current.getEditor();
    const range = editor.getSelection(true);
    setSelectedRange(range);
    setShowLangSelector(true);
  }, []);

  const handleLangConfirm = () => {
    const editor = quillRef.current.getEditor();
    if (selectedRange) {
      editor.insertText(selectedRange.index, "\n", "user");
      editor.insertEmbed(selectedRange.index, "code-block", true, "user");
      const [line] = editor.getLines(selectedRange.index, 1);
      line.domNode.dataset.language = selectedLanguage; // Guardamos lenguaje
    }
    setShowLangSelector(false);
    setSelectedRange(null);
  };

  // ---------- QUILL MODULES ----------
  const modules = isReady
    ? {
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ align: [] }],
          ["link", "image", "code-block"],
          ["clean"],
        ],
        handlers: {
          image: imageHandler,
          "code-block": codeHandler,
        },
      },
      imageResize: { parchment: Quill.import("parchment"), modules: ["Resize", "DisplaySize"] },
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
    "code-block",
    "align",
    "width",
  ];

  const cleanHtml = (html) => html.replace(/<p><br><\/p>/g, "<br>");

  const cleanNPBSP = (content) => content.replace(/&nbsp;/g, ' ');


  // ---------- HANDLE SAVE ----------
  const handleSave = () => {
    const turndownService = new TurndownService();
    const cleanedHtml = cleanHtml(content);

    const finalHtml = cleanNPBSP(cleanedHtml);

    // Agregar clases de lenguaje a los bloques
    const tempDiv = document.createElement("div");

    //tempDiv.innerHTML = cleanedHtml;
    tempDiv.innerHTML = finalHtml;
    const blocks = tempDiv.querySelectorAll("pre.ql-syntax");
    blocks.forEach((block) => {
      if (!block.dataset.language) block.dataset.language = "plaintext";
    });

    const htmlWithLang = tempDiv.innerHTML;
    setSavedHtml(htmlWithLang);
    const markdown = turndownService.turndown(htmlWithLang);

    console.log("HTML Original:", content);
    console.log("HTML Limpio:", htmlWithLang);
    console.log("Markdown:", markdown);


  };

  const handleApiCall = () => {
    if (selectedEndpoint === "/api/test/users/with-posts-raw") {
      setShowApiSelector(false);
      handleApiCallLight(); // <-- aquí hacemos la llamada y abrimos el modal
      return;
    }

    // Para otros endpoints, hacer fetch directamente
    fetchBackendEndpoint(selectedEndpoint);
  };


  // Función para llamar al backend
  const fetchBackendEndpoint = async (endpoint) => {
    try {
      const response = await fetch(`${backendUrl}${endpoint}`);
      const json = await response.json();

      if (!response.ok) {
        console.error("Error en API:", json);
        alert(json.message || "Hubo un error en la llamada. Revisa consola.");
        return;
      }

      console.log("Respuesta API:", json.data || json);
      alert("Consulta exitosa, revisa la consola!");
    } catch (error) {
      console.error("Error en la llamada API:", error);
      alert("Hubo un error en la llamada. Revisa consola.");
    } finally {
      setShowApiSelector(false);
    }
  };


  // Función para cargar opciones según el nivel
  const loadOptions = async (level) => {
    setLoadingOptions(true);
    try {
      let url = `${backendUrl}/api/test/`;
      switch (level) {
        case "category": url += "categories"; break;
        case "subcategory": url += "subcategories"; break;
        case "element": url += "elements"; break;
        default: url += "categories";
      }

      const response = await fetch(url);
      const json = await response.json();

      if (!response.ok) {
        alert(json.message || "Error al cargar opciones");
        setOptions([]);
      } else {
        setOptions(json.data || json);
      }
    } catch (error) {
      console.error("Error cargando opciones:", error);
      setOptions([]);
    } finally {
      setLoadingOptions(false);
    }
  };



  const handleCreatePost = async () => {
    if (!selectedOptionId) {
      alert("Selecciona una opción antes de crear el post");
      return;
    }

    if (!savedHtml || savedHtml.trim().length === 0) {
      alert("⚠️ No hay contenido en el editor. No se puede crear el post.");
      return;
    }

    const titleToUse = postTitle.trim() === "" ? "Post Prueba" : postTitle;

    const postObject = {
      userId: 1, // simula usuario logueado
      categoryId: postLevel === "category" ? selectedOptionId : null,
      subcategoryId: postLevel === "subcategory" ? selectedOptionId : null,
      elementId: postLevel === "element" ? selectedOptionId : null,
      title: titleToUse,
      content: savedHtml,
    };

    try {
      const response = await fetch(`${backendUrl}/api/test/create-post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postObject),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`Error al crear post: ${data.message || "Error desconocido"}`);
        console.error("Error del backend:", data);
        return;
      }

      alert(`Post creado correctamente: ${data.data.title}`);
      console.log("Respuesta del backend:", data);
      setShowCreatePostModal(false);
      setPostTitle(""); // limpiar input
    } catch (error) {
      console.error("Error al conectar con el backend:", error);
      alert("No se pudo conectar con el backend. Revisa la consola.");
    }
  };


  const handleApiCallLight = async () => {
    try {
      // Aquí estaba mal, ahora usamos el endpoint con posts
      const response = await fetch(`${backendUrl}/api/test/users/with-posts-raw`);
      const json = await response.json();

      if (!response.ok) {
        alert(json.message || "Error cargando usuarios");
        return;
      }

      const users = json.data || [];
      if (!users.length) {
        alert("No se encontraron usuarios");
        return;
      }

      setUsersForPreview(users);
      setSelectedUserId(null);
      setSelectedPostId(null);
      setPostsForSelectedUser([]);
      setShowUserPostSelector(true); // abrir modal con usuarios cargados
    } catch (error) {
      console.error(error);
      alert("Error en la llamada API");
    }
  };




  const handleConfirmPostSelection = () => {
    if (!selectedUserId || selectedPostId == null) {
      return alert("Selecciona un post");
    }

    const user = usersForPreview.find(u => u.id === selectedUserId);
    if (!user) return alert("Usuario no encontrado");

    const post = user.posts.find(p => p.id === selectedPostId);
    if (!post) return alert("Post no encontrado");

    setSavedHtml(post.content || "");
    alert("Post cargado correctamente: " + post.title);

    setShowUserPostSelector(false);
    setShowApiSelector(false);
  };




  // ---------- HIGHLIGHT JS ----------
  useEffect(() => {
    if (!savedHtml) return;

    const blocks = document.querySelectorAll(".blog-preview pre.ql-syntax");

    blocks.forEach((block) => {
      const code = block.textContent;
      const lang = block.dataset.language;
      const result = lang
        ? hljs.highlight(code, { language: lang })
        : hljs.highlightAuto(code, languages);

      block.innerHTML = result.value;

      // Label
      const oldLabel = block.querySelector(".language-label");
      if (oldLabel) oldLabel.remove();
      const label = document.createElement("div");
      label.textContent = result.language || "plaintext";
      label.className = "language-label";
      label.style.cssText = `
        position: absolute;
        top: 0;
        right: 0;
        background: #333;
        color: #fff;
        padding: 2px 6px;
        font-size: 12px;
        border-radius: 0 0 0 5px;
      `;
      block.style.position = "relative";
      block.appendChild(label);
    });
  }, [savedHtml]);

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
        style={{ marginTop: "10px", padding: "10px 20px", fontWeight: "bold", cursor: "pointer" }}
      >
        Guardar Post
      </button>

      <button
        onClick={() => setShowApiSelector(true)}
        style={{ marginTop: "10px", padding: "10px 20px", fontWeight: "bold", cursor: "pointer", backgroundColor: "#28a745", color: "#fff" }}
      >
        Probar API
      </button>

      <button
        onClick={() => setShowCreatePostModal(true)}
        style={{ marginTop: "10px", padding: "10px 20px", fontWeight: "bold", cursor: "pointer", backgroundColor: "#007bff", color: "#fff" }}
      >
        Crear Nuevo Post
      </button>



      {savedHtml && (
        <div style={{ marginTop: "40px" }}>
          <h3>Vista previa HTML</h3>
          <div
            className="blog-preview"
            style={{ border: "1px solid #ccc", borderRadius: "5px", padding: "15px" }}
            dangerouslySetInnerHTML={{ __html: savedHtml }}
          />
        </div>
      )}

      {/* Imagen selector */}
      {showSizeSelector && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 1000,
        }}>
          <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.3)", textAlign: "center" }}>
            <h3>Introduce el ancho inicial (en px)</h3>
            <input
              type="number"
              value={customWidth}
              onChange={(e) => setCustomWidth(e.target.value)}
              style={{ marginTop: "10px", padding: "8px", width: "100px", textAlign: "center", borderRadius: "5px", border: "1px solid #ccc", fontSize: "16px" }}
            />
            <div style={{ marginTop: "20px" }}>
              <button onClick={handleSizeConfirm} style={{ padding: "8px 16px", marginRight: "10px", background: "#007bff", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}>Confirmar</button>
              <button onClick={() => setShowSizeSelector(false)} style={{ padding: "8px 16px", background: "#ccc", border: "none", borderRadius: "5px", cursor: "pointer" }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* API selector */}
      {showApiSelector && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 1000,
        }}>
          <div style={{
            background: "#fff", padding: "20px", borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)", textAlign: "center", width: "400px"
          }}>
            <h3>Selecciona un endpoint</h3>
            <select
              value={selectedEndpoint}
              onChange={(e) => setSelectedEndpoint(e.target.value)}
              style={{ marginTop: "10px", padding: "8px", fontSize: "16px", width: "100%" }}
            >
              {endpoints.map((endpoint) => (
                <option key={endpoint.path} value={endpoint.path}>
                  {endpoint.label}
                </option>
              ))}
            </select>
            <div style={{ marginTop: "20px" }}>
              <button
                onClick={handleApiCall} // se esta probando luego cambiar handleApiCall
                style={{ padding: "8px 16px", marginRight: "10px", background: "#007bff", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}
              >
                Confirmar
              </button>
              <button
                onClick={() => setShowApiSelector(false)}
                style={{ padding: "8px 16px", background: "#ccc", border: "none", borderRadius: "5px", cursor: "pointer" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreatePostModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 1000,
        }}>
          <div style={{
            background: "#fff", padding: "20px", borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)", textAlign: "center", width: "400px"
          }}>
            <h3>Crear nuevo post</h3>

            <label>Nivel del post:</label>
            <select
              value={postLevel}
              onChange={(e) => setPostLevel(e.target.value)}
              style={{ marginTop: "10px", padding: "8px", width: "100%" }}
            >
              <option value="category">Categoría</option>
              <option value="subcategory">Subcategoría</option>
              <option value="element">Elemento</option>
            </select>

            <label style={{ marginTop: "15px", display: "block" }}>Selecciona opción:</label>
            {loadingOptions ? (
              <p>Cargando opciones...</p>
            ) : options.length === 0 ? (
              <p style={{ color: "red" }}>⚠️ No se pudieron cargar las opciones</p>
            ) : (
              <select
                value={selectedOptionId || ""}
                onChange={(e) => setSelectedOptionId(e.target.value)}
                style={{ marginTop: "10px", padding: "8px", width: "100%" }}
              >
                <option value="" disabled>Selecciona...</option>
                {options.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.name || opt.title}</option>
                ))}
              </select>
            )}

            <label style={{ marginTop: "15px", display: "block" }}>Título del post:</label>
            <input
              type="text"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              placeholder="Introduce el título"
              style={{ marginTop: "5px", padding: "8px", width: "100%" }}
            />

            <div style={{ marginTop: "20px" }}>
              <button
                onClick={handleCreatePost}
                style={{ padding: "8px 16px", marginRight: "10px", background: "#28a745", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}
              >
                Crear Post
              </button>
              <button
                onClick={() => setShowCreatePostModal(false)}
                style={{ padding: "8px 16px", background: "#ccc", border: "none", borderRadius: "5px", cursor: "pointer" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}


      {showUserPostSelector && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 1000,
        }}>
          <div style={{
            background: "#fff", padding: "20px", borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)", width: "400px", textAlign: "center"
          }}>
            <h3>Selecciona usuario y post</h3>

            <label style={{ marginTop: "10px", display: "block" }}>Usuario:</label>
            <select
              value={selectedUserId ?? ""}
              onChange={(e) => {
                const userId = Number(e.target.value);
                setSelectedUserId(userId);

                const user = usersForPreview.find(u => Number(u.id) === userId);
                setPostsForSelectedUser(user?.posts ?? []);
                setSelectedPostId(null);
              }}

              style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            >
              <option value="" disabled>Selecciona usuario...</option>
              {usersForPreview.map(u => (
                <option key={u.id} value={u.id}>{u.username}</option>
              ))}
            </select>

            {selectedUserId && (
              <>
                {postsForSelectedUser.length > 0 ? (
                  <>
                    <label style={{ marginTop: "15px", display: "block" }}>Post:</label>
                    <select
                      value={selectedPostId ?? ""}
                      onChange={e => setSelectedPostId(Number(e.target.value))} // asegurar número
                      style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                    >
                      <option value="" disabled>Selecciona post...</option>
                      {postsForSelectedUser.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </>
                ) : (
                  <p style={{ marginTop: "15px", color: "red" }}>⚠️ Este usuario no tiene posts disponibles</p>
                )}
              </>
            )}

            <div style={{ marginTop: "20px" }}>
              <button
                onClick={handleConfirmPostSelection}
                style={{ padding: "8px 16px", marginRight: "10px", background: "#28a745", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}
              >
                Confirmar
              </button>
              <button
                onClick={() => setShowUserPostSelector(false)}
                style={{ padding: "8px 16px", background: "#ccc", border: "none", borderRadius: "5px", cursor: "pointer" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}




      {/* Language selector */}
      {showLangSelector && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 1000,
        }}>
          <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.3)", textAlign: "center" }}>
            <h3>Selecciona el lenguaje del bloque de código</h3>
            <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} style={{ marginTop: "10px", padding: "8px", fontSize: "16px" }}>
              {languages.map((lang) => (
                <option key={lang} value={lang}>{lang.toUpperCase()}</option>
              ))}
            </select>
            <div style={{ marginTop: "20px" }}>
              <button onClick={handleLangConfirm} style={{ padding: "8px 16px", marginRight: "10px", background: "#007bff", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}>Confirmar</button>
              <button onClick={() => setShowLangSelector(false)} style={{ padding: "8px 16px", background: "#ccc", border: "none", borderRadius: "5px", cursor: "pointer" }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .blog-preview .ql-align-center { text-align: center; }
        .blog-preview .ql-align-right { text-align: right; }
        .blog-preview .ql-align-left { text-align: left; }
        .blog-preview .ql-align-justify { text-align: justify; }
        .ql-editor img { max-width: 100%; height: auto; }

        .ql-editor pre, .blog-preview pre {
          background-color: #1e1e1e;
          color: #dcdcdc;
          padding: 10px;
          border-radius: 5px;
          overflow-x: auto;
          font-family: 'Courier New', Courier, monospace;
          white-space: pre-wrap;
          position: relative;
        }

        .blog-preview p {
          white-space: pre-wrap;
        }

        .ql-editor code, .blog-preview code {
          background-color: #1e1e1e;
          color: #dcdcdc;
          padding: 2px 4px;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}
