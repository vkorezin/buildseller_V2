import React, { useState, useMemo, useEffect, useLayoutEffect } from "react";
import emailjs from "@emailjs/browser";
import BlockEditor from "./BlockEditor";
import MasterPlanView from "./MasterPlanView";
import DatabaseEditor from "./DatabaseEditor";
import CraneDatabaseEditor from "./CraneDatabaseEditor";
import LoadsEditor from "./LoadsEditor";
import GableEditor from "./GableEditor";
import MezzanineEditor from "./MezzanineEditor";
import QuickEstimator from "./QuickEstimator";
import ProjectDatabase from "./ProjectDatabase";

function useWindowSize() {
  const [size, setSize] = useState([0, 0]);
  useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);
  return size;
}

const SIDES = ["A", "B", "1", "2"];
const NORMS_DATABASE_KEY =
  process.env.REACT_APP_NORMS_DB_KEY || "BuildingCalculatorNormsDBv3";
const CRANE_DATABASE_KEY =
  process.env.REACT_APP_CRANE_DB_KEY || "BuildingCalculatorCranesDBv1";

// ✅ ИСПРАВЛЕНО: Принудительное приведение к строке с trim
const ADMIN_PIN = String(process.env.REACT_APP_ADMIN_PIN || "2159").trim();

const DEFAULT_NORMS_DATA = {
  sp: {
    name: "СП 20.13330",
    terrains: [
      { id: "A", name: "Тип A" },
      { id: "B", name: "Тип B" },
      { id: "C", name: "Тип C (>25м)" },
    ],
    locations: [
      {
        id: "mos",
        name: "Москва",
        snow: 1.5,
        wind: 0.23,
        seismic: 0,
        gammas: 1.4,
        gammaw: 1.4,
      },
      {
        id: "spb",
        name: "Санкт-Петербург",
        snow: 1.8,
        wind: 0.3,
        seismic: 0,
        gammas: 1.4,
        gammaw: 1.4,
      },
    ],
  },
  kmk: {
    name: "КМК",
    terrains: [
      { id: "A", name: "Тип 1" },
      { id: "B", name: "Тип 2" },
    ],
    locations: [
      {
        id: "tash",
        name: "Ташкент",
        snow: 0.5,
        wind: 0.23,
        seismic: 8,
        gammas: 1.4,
        gammaw: 1.4,
      },
      {
        id: "sam",
        name: "Самарканд",
        snow: 0.4,
        wind: 0.23,
        seismic: 7,
        gammas: 1.4,
        gammaw: 1.4,
      },
    ],
  },
};

const DEFAULT_CRANES_DATA = [
  {
    id: "crane_t5_s24",
    name: "Кран 5т (22-24м)",
    capacity: 5,
    minBuildingSpan: 22.0,
    maxBuildingSpan: 24.0,
    craneSpan: 22.5,
    supportHeight: 8.0,
    hookHeight: 6.0,
    wheelLoad: 15.0,
    trolleyMass: 1.2,
    wheelCount: 4,
    supportCount: 2,
  },
  {
    id: "crane_t10_s24",
    name: "Кран 10т (22-24м)",
    capacity: 10,
    minBuildingSpan: 22.0,
    maxBuildingSpan: 24.0,
    craneSpan: 22.5,
    supportHeight: 8.5,
    hookHeight: 6.0,
    wheelLoad: 20.0,
    trolleyMass: 2.0,
    wheelCount: 4,
    supportCount: 2,
  },
];

function checkCollision(rect1, rect2) {
  const gap = 0.001;
  return (
    rect1.x < rect2.x + rect2.w - gap &&
    rect1.x + rect1.w > rect2.x + gap &&
    rect1.y < rect2.y + rect2.l - gap &&
    rect1.y + rect1.l > rect2.y + gap
  );
}

export default function App() {
  const [width] = useWindowSize();
  const isMobile = width < 900;

  const styles = {
    managerContainer: { padding: "20px", fontFamily: "Arial, sans-serif" },
    mainLayout: {
      display: "flex",
      gap: "20px",
      flexDirection: isMobile ? "column-reverse" : "row",
    },
    leftColumn: {
      width: isMobile ? "100%" : "450px",
      minWidth: isMobile ? "auto" : "400px",
    },
    rightColumn: {
      flex: 1,
      position: isMobile ? "static" : "sticky",
      top: "20px",
      height: isMobile ? "auto" : "calc(100vh - 40px)",
    },
    blockCardsContainer: {
      display: "flex",
      flexWrap: "wrap",
      gap: "15px",
      padding: "15px",
      border: "1px solid #eee",
      borderRadius: "8px",
      justifyContent: isMobile ? "center" : "flex-start",
    },
    blockCard: {
      border: "2px solid #007bff",
      borderRadius: "8px",
      padding: "10px",
      width: isMobile ? "100%" : "300px",
      backgroundColor: "#f4faff",
      flexGrow: 1,
      maxWidth: isMobile ? "100%" : "350px",
    },
    blockCardHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: "1px solid #ccc",
      paddingBottom: "5px",
    },
    headerButtons: { display: "flex", gap: "5px" },
    rotateButton: {
      padding: "5px",
      backgroundColor: "#eee",
      border: "1px solid #ccc",
      borderRadius: "5px",
      cursor: "pointer",
      lineHeight: 1,
    },
    editButton: {
      padding: "5px 10px",
      backgroundColor: "#007bff",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
    },
    deleteButton: {
      padding: "5px 10px",
      backgroundColor: "#d90000",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
    },
    blockCardBody: {
      paddingTop: "10px",
      display: "grid",
      gridTemplateColumns: "120px 1fr",
      gap: "8px",
    },
    label: { fontWeight: "bold", fontSize: "0.9em" },
    input: {
      width: "100%",
      padding: "8px",
      boxSizing: "border-box",
      marginBottom: "10px",
      border: "1px solid #ccc",
      borderRadius: "4px",
    },
    select: {
      width: "100%",
      padding: "8px",
      marginBottom: "10px",
      boxSizing: "border-box",
      border: "1px solid #ccc",
      borderRadius: "4px",
    },
    blockCardAdd: {
      border: "2px dashed #ccc",
      borderRadius: "8px",
      width: isMobile ? "100%" : "300px",
      flexGrow: 1,
      maxWidth: isMobile ? "100%" : "350px",
      textAlign: "center",
      cursor: "pointer",
      backgroundColor: "#f9f9f9",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "50px",
      color: "#ccc",
      minHeight: "160px",
    },
    dbButton: {
      margin: "0 5px 5px 0",
      padding: "8px 12px",
      fontSize: "0.8em",
      backgroundColor: "#eee",
      border: "1px solid #ccc",
      borderRadius: "5px",
      cursor: "pointer",
      display: "inline-block",
    },
    errorBox: {
      padding: "10px",
      backgroundColor: "#ffebe6",
      border: "1px solid #ffc0b0",
      color: "#d90000",
      borderRadius: "5px",
      marginTop: "10px",
      fontWeight: "bold",
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: "white",
      padding: "20px",
      borderRadius: "8px",
      width: "300px",
      maxWidth: "90%",
      textAlign: "center",
    },
    pinInput: {
      width: "100%",
      padding: "10px",
      fontSize: "1.2em",
      textAlign: "center",
      letterSpacing: "0.5em",
      margin: "15px 0",
      boxSizing: "border-box",
    },
    modalButton: {
      padding: "10px 15px",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      margin: "0 5px",
      backgroundColor: "#007bff",
      color: "white",
    },
    tabs: {
      display: "flex",
      marginBottom: "15px",
      borderBottom: "1px solid #ccc",
    },
    tab: {
      padding: "10px 15px",
      cursor: "pointer",
      flex: 1,
      textAlign: "center",
      fontWeight: "bold",
      color: "#666",
      borderBottom: "3px solid transparent",
    },
    tabActive: {
      padding: "10px 15px",
      backgroundColor: "#f0f7ff",
      color: "#007bff",
      cursor: "pointer",
      flex: 1,
      textAlign: "center",
      fontWeight: "bold",
      borderBottom: "3px solid #007bff",
    },
    autoResult: {
      backgroundColor: "#e6f7ff",
      padding: "10px",
      borderRadius: "4px",
      border: "1px solid #b0e0ff",
      color: "#005699",
      marginTop: "10px",
      fontSize: "0.9em",
    },
    setupContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      backgroundColor: "#f0f2f5",
      fontFamily: "Arial, sans-serif",
      padding: "20px",
    },
    setupCard: {
      backgroundColor: "white",
      padding: "40px",
      borderRadius: "12px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
      width: "500px",
      maxWidth: "100%",
    },
    setupTitle: {
      marginTop: 0,
      marginBottom: "25px",
      color: "#333",
      textAlign: "center",
      fontSize: "1.5em",
      fontWeight: "bold",
    },
    setupSectionTitle: {
      fontSize: "1.1em",
      fontWeight: "bold",
      color: "#007bff",
      marginTop: "20px",
      marginBottom: "10px",
      borderBottom: "1px solid #eee",
      paddingBottom: "5px",
    },
    primaryButton: {
      width: "100%",
      padding: "14px",
      backgroundColor: "#007bff",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontSize: "1.1em",
      fontWeight: "bold",
      cursor: "pointer",
      marginTop: "30px",
      transition: "background 0.2s",
    },
    secondaryButton: {
      width: "100%",
      padding: "14px",
      backgroundColor: "#6c757d",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontSize: "1em",
      cursor: "pointer",
      marginTop: "10px",
      transition: "background 0.2s",
    },
    backLink: {
      cursor: "pointer",
      color: "#666",
      textDecoration: "underline",
      fontSize: "0.9em",
      marginRight: "15px",
    },
    warningBox: {
      padding: "10px",
      backgroundColor: "#fff3cd",
      border: "1px solid #ffeeba",
      color: "#856404",
      borderRadius: "5px",
      marginTop: "10px",
      fontSize: "0.9em",
    },
    svgCanvas: {
      width: "100%",
      border: "1px solid #eee",
      borderRadius: "4px",
      backgroundColor: "#f9f9f9",
      aspectRatio: "1/1",
    },
    svgOutline: { fill: "none", stroke: "#333", strokeWidth: 2 },
    svgErrorOutline: {
      fill: "rgba(255, 0, 0, 0.3)",
      stroke: "#d90000",
      strokeWidth: 2,
    },
    svgAxisText: {
      fontSize: "10px",
      fill: "#333",
      fontFamily: "Arial",
      textAnchor: "middle",
      dominantBaseline: "middle",
      fontWeight: "bold",
    },
    centered: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#777",
    },
  };

  const [blocks, setBlocks] = useState([
    {
      id: 1,
      name: "Блок 1",
      adj: {
        parentId: null,
        parentSide: null,
        mySide: null,
        distance: 0,
        offset: 0,
      },
      data: {
        generalData: { blockWidth: 80, blockLength: 120, blockHeight: 12 },
        spans: [
          {
            id: 1,
            spanWidth: 80,
            slope: 10,
            skateCount: 1,
            baseElevation: 0.0,
            eaveHeight: 12,
            slopeDirection: "right",
            skate1Length: 40,
            cranes: [],
          },
        ],
        columnStep: 6,
        orientation: "horizontal",
        mezzanines: [],
        loads: null,
        gables: null,
      },
    },
  ]);

  const [normsData, setNormsData] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem(NORMS_DATABASE_KEY)) ||
        DEFAULT_NORMS_DATA
      );
    } catch {
      return DEFAULT_NORMS_DATA;
    }
  });

  const [craneDb, setCraneDb] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem(CRANE_DATABASE_KEY)) ||
        DEFAULT_CRANES_DATA
      );
    } catch {
      return DEFAULT_CRANES_DATA;
    }
  });

  const [projectsDb, setProjectsDb] = useState([]);
  const [projectSettings, setProjectSettings] = useState({
    loadInputMode: "auto",
    norm: "sp",
    location: "mos",
    terrain: "A",
    userName: "",
    userEmail: "",
    manualSnow: 0.5,
    manualWind: 0.23,
    manualSeismic: 0,
    gammaSnow: 1.4,
    gammaWind: 1.4,
  });

  const [currentView, setCurrentView] = useState("quickestimator");
  const [editingBlockId, setEditingBlockId] = useState(null);
  const [tempBlockData, setTempBlockData] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [dbEditorTarget, setDbEditorTarget] = useState(null);

  const [isEmailJsReady, setIsEmailJsReady] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [codeExpireTime, setCodeExpireTime] = useState(null);

  useEffect(() => {
    if (document.getElementById("emailjs-script")) {
      setIsEmailJsReady(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "emailjs-script";
    script.src =
      "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
    script.async = true;
    script.onload = () => {
      if (window.emailjs) {
        window.emailjs.init("rcIrfouvArL0OQVe0");
        setIsEmailJsReady(true);
      }
    };
    script.onerror = () => setIsEmailJsReady(false);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    localStorage.setItem(NORMS_DATABASE_KEY, JSON.stringify(normsData));
  }, [normsData]);

  useEffect(() => {
    localStorage.setItem(CRANE_DATABASE_KEY, JSON.stringify(craneDb));
  }, [craneDb]);

  const handleAddBlock = () => {
    const newId =
      blocks.length > 0 ? Math.max(...blocks.map((b) => b.id)) + 1 : 1;
    setBlocks([
      ...blocks,
      {
        id: newId,
        name: `Блок ${newId}`,
        adj: {
          parentId: 1,
          parentSide: "B",
          mySide: "A",
          distance: 0,
          offset: 0,
        },
        data: {
          generalData: { blockWidth: 50, blockLength: 50, blockHeight: 8 },
          spans: [
            {
              id: 1,
              spanWidth: 50,
              slope: 10,
              skateCount: 1,
              baseElevation: 0.0,
              eaveHeight: 8,
              slopeDirection: "right",
              skate1Length: 25,
              cranes: [],
            },
          ],
          columnStep: 5,
          orientation: "horizontal",
          mezzanines: [],
          loads: null,
          gables: null,
        },
      },
    ]);
  };

  const handleDeleteBlock = (id) => {
    if (blocks.some((b) => b.adj.parentId === id)) {
      alert("Невозможно удалить блок, к которому привязаны другие блоки.");
      return;
    }
    setBlocks(blocks.filter((b) => b.id !== id));
  };

  const handleBlockChange = (id, field, value) => {
    setBlocks(
      blocks.map((b) => {
        if (b.id !== id) return b;
        let newB = JSON.parse(JSON.stringify(b));
        if (field === "w") {
          newB.data.generalData.blockWidth = parseFloat(value) || 0;
          newB.data.spans[0].spanWidth = parseFloat(value) || 0;
        } else if (field === "l") {
          newB.data.generalData.blockLength = parseFloat(value) || 0;
        } else if (field === "h") {
          newB.data.generalData.blockHeight = parseFloat(value) || 0;
        } else if (["distance", "offset"].includes(field)) {
          newB.adj[field] = parseFloat(value) || 0;
        } else if (field === "parentId") {
          newB.adj.parentId = parseInt(value);
        } else {
          newB.adj[field] = value;
        }
        return newB;
      })
    );
  };

  const handleRotateBlock = (id) => {
    setBlocks(
      blocks.map((b) =>
        b.id === id
          ? {
              ...b,
              data: {
                ...b.data,
                orientation:
                  b.data.orientation === "horizontal"
                    ? "vertical"
                    : "horizontal",
              },
            }
          : b
      )
    );
  };

  const handleProjectSettingsChange = (e) => {
    const { name, value } = e.target;
    if (name === "norm") {
      const newNormData = normsData[value];
      setProjectSettings((p) => ({
        ...p,
        norm: value,
        location: newNormData?.locations?.[0]?.id || "",
        terrain: newNormData?.terrains?.[0]?.id || "",
      }));
    } else {
      setProjectSettings((p) => ({ ...p, [name]: value }));
    }
  };

  const handleRegistration = () => {
    if (!projectSettings.userName || !projectSettings.userEmail) {
      alert("Пожалуйста, заполните имя и Email.");
      return;
    }
    if (!isEmailJsReady) {
      alert("EmailJS загружается. Подождите...");
      return;
    }
    setIsSending(true);
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    const templateParams = {
      to_name: projectSettings.userName,
      to_email: projectSettings.userEmail,
      code: code,
      message: "Ваш код подтверждения для BuildSeller!",
    };

    if (!window.emailjs) {
      alert("EmailJS не загружен. Попробуйте обновить страницу.");
      setIsSending(false);
      return;
    }

    window.emailjs
      .send("service_oiabn3p", "template_zrd5quj", templateParams)
      .then(() => {
        setGeneratedCode(code);
        setVerifiedEmail(projectSettings.userEmail);
        setCodeExpireTime(Date.now() + 5 * 60 * 1000);
        setIsCodeSent(true);
        alert(`Код отправлен на ${projectSettings.userEmail}!`);
      })
      .catch((err) => {
        console.error("EmailJS error:", err);
        alert("Ошибка отправки. Проверьте email и попробуйте снова.");
      })
      .finally(() => setIsSending(false));
  };

  const handleVerifyCode = () => {
    if (Date.now() > codeExpireTime) {
      alert("Код истек. Запросите новый.");
      handleResendEmail();
      return;
    }
    if (projectSettings.userEmail !== verifiedEmail) {
      alert(
        `Код был отправлен на ${verifiedEmail}, но email был изменен. Запросите новый код.`
      );
      return;
    }
    if (inputCode.trim() === generatedCode.trim()) {
      setCurrentView("manager");
      setInputCode("");
      setGeneratedCode("");
      setVerifiedEmail("");
      setCodeExpireTime(null);
    } else {
      alert("Неверный код!");
    }
  };

  const handleResendEmail = () => {
    setInputCode("");
    setGeneratedCode("");
    setVerifiedEmail("");
    setCodeExpireTime(null);
    setIsCodeSent(false);
  };

  const startEditing = (id) => {
    const block = blocks.find((b) => b.id === id);
    if (!block) return;
    setEditingBlockId(id);
    setTempBlockData(JSON.parse(JSON.stringify(block.data)));
    setCurrentView("editor");
  };

  const handleSaveAndCloseEditor = (newData) => {
    if (newData) {
      setBlocks(
        blocks.map((b) =>
          b.id === editingBlockId
            ? { ...b, data: { ...b.data, ...newData } }
            : b
        )
      );
    }
    setEditingBlockId(null);
    setTempBlockData(null);
    setCurrentView("manager");
  };

  const handleStep1Geometry = (geometryData) => {
    setTempBlockData((prev) => ({ ...prev, ...geometryData }));
    setCurrentView("loadseditor");
  };

  const handleStep2Loads = (loadsData) => {
    setTempBlockData((prev) => ({ ...prev, loads: loadsData }));
    setCurrentView("gableseditor");
  };

  const handleBackFromLoads = (loadsData) => {
    if (loadsData) setTempBlockData((prev) => ({ ...prev, loads: loadsData }));
    setCurrentView("editor");
  };

  const handleBackFromGables = (gablesData) => {
    if (gablesData)
      setTempBlockData((prev) => ({ ...prev, gables: gablesData }));
    setCurrentView("loadseditor");
  };

  const handleOpenMezzanineEditor = (currentData) => {
    setTempBlockData((prev) => ({ ...prev, ...currentData }));
    setCurrentView("mezzanineeditor");
  };

  const handleBackFromMezzanine = (updatedMezzanines) => {
    setTempBlockData((prev) => ({ ...prev, mezzanines: updatedMezzanines }));
    setCurrentView("editor");
  };

  const handleStep3Calculation = (gablesData) => {
    const finalData = { ...tempBlockData, gables: gablesData };
    setBlocks(
      blocks.map((b) =>
        b.id === editingBlockId ? { ...b, data: finalData } : b
      )
    );
    alert("Расчет завершен! Переход в BIM-просмотр.");
    setCurrentView("bimviewer");
  };

  const currentLoadData = useMemo(() => {
    if (projectSettings.loadInputMode === "manual") {
      return {
        snow: parseFloat(projectSettings.manualSnow) || 0,
        wind: parseFloat(projectSettings.manualWind) || 0,
        seismic: parseFloat(projectSettings.manualSeismic) || 0,
        gammas: parseFloat(projectSettings.gammaSnow) || 1,
        gammaw: parseFloat(projectSettings.gammaWind) || 1,
      };
    }
    const norm = normsData[projectSettings.norm];
    const loc = norm?.locations.find((l) => l.id === projectSettings.location);
    return loc || { snow: 0, wind: 0, seismic: 0, gammas: 1, gammaw: 1 };
  }, [projectSettings, normsData]);

  const masterPlanLayout = useMemo(() => {
    const map = new Map(blocks.map((b) => [b.id, b]));
    const placed = new Map();
    const coll = new Set();
    const errs = [];

    const getParentEdge = (pRect, side) => {
      if (side === "A") return { type: "left", val: pRect.x };
      if (side === "B") return { type: "right", val: pRect.x + pRect.w };
      if (side === "1") return { type: "top", val: pRect.y };
      if (side === "2") return { type: "bottom", val: pRect.y + pRect.l };
      return { type: "error", val: 0 };
    };

    const place = (id) => {
      if (placed.has(id)) return placed.get(id);
      const b = map.get(id);
      if (!b) return null;
      const isVert = b.data.orientation === "vertical";
      const w = isVert
        ? b.data.generalData.blockLength
        : b.data.generalData.blockWidth;
      const l = isVert
        ? b.data.generalData.blockWidth
        : b.data.generalData.blockLength;

      if (id === 1 || !b.adj.parentId) {
        const p = {
          id,
          name: b.name,
          x: 0,
          y: 0,
          w,
          l,
          orientation: b.data.orientation,
        };
        placed.set(id, p);
        return p;
      }
      const pp = place(b.adj.parentId);
      if (!pp) return null;
      const pEdge = getParentEdge(pp, b.adj.parentSide);
      let nx = 0,
        ny = 0;
      const dist = b.adj.distance || 0;
      const off = b.adj.offset || 0;

      if (pEdge.type === "right") {
        nx = b.adj.mySide === "A" ? pEdge.val + dist : pEdge.val + dist - w;
        ny = pp.y + off;
      } else if (pEdge.type === "left") {
        nx = b.adj.mySide === "B" ? pEdge.val - dist - w : pEdge.val - dist;
        ny = pp.y + off;
      } else if (pEdge.type === "bottom") {
        ny = b.adj.mySide === "1" ? pEdge.val + dist : pEdge.val + dist - l;
        nx = pp.x + off;
      } else if (pEdge.type === "top") {
        ny = b.adj.mySide === "2" ? pEdge.val - dist - l : pEdge.val - dist;
        nx = pp.x + off;
      }
      const p = {
        id,
        name: b.name,
        x: nx,
        y: ny,
        w,
        l,
        orientation: b.data.orientation,
      };
      placed.set(id, p);
      return p;
    };

    blocks.forEach((b) => place(b.id));

    const layout = Array.from(placed.values());
    for (let i = 0; i < layout.length; i++) {
      for (let j = i + 1; j < layout.length; j++) {
        if (checkCollision(layout[i], layout[j])) {
          coll.add(layout[i].id);
          coll.add(layout[j].id);
          errs.push(`Коллизия: ${layout[i].name} ⇄ ${layout[j].name}`);
        }
      }
    }
    return { layout, errorMessages: errs, collidingIds: Array.from(coll) };
  }, [blocks]);

  if (currentView === "database") {
    return (
      <ProjectDatabase
        projects={projectsDb}
        setProjects={setProjectsDb}
        onBack={() => setCurrentView("manager")}
      />
    );
  }

  if (currentView === "quickestimator") {
    return (
      <QuickEstimator
        onBack={() => setCurrentView("manager")}
        projectsDb={projectsDb}
      />
    );
  }

  if (currentView === "pinprompt") {
    return (
      <div style={styles.modalOverlay}>
        <div style={styles.modalContent}>
          <h3>Введите PIN</h3>
          <input
            type="password"
            style={styles.pinInput}
            value={pinInput}
            onChange={(e) => {
              // ✅ ИСПРАВЛЕНО: Убираем все пробелы при вводе
              setPinInput(e.target.value.replace(/\s/g, ""));
              setPinError("");
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                // ✅ ИСПРАВЛЕНО: Приведение обоих значений к строке с trim
                const cleanPin = String(pinInput).trim();
                const expectedPin = String(ADMIN_PIN).trim();

                if (cleanPin === expectedPin) {
                  setCurrentView(
                    dbEditorTarget === "norms" ? "dbeditor" : "dbcraneeditor"
                  );
                  setPinInput("");
                  setPinError("");
                } else {
                  setPinError("Неверный PIN!");
                }
              }
            }}
          />
          {pinError && (
            <div style={{ color: "red", marginBottom: "10px" }}>{pinError}</div>
          )}
          <button
            style={styles.modalButton}
            onClick={() => {
              // ✅ ИСПРАВЛЕНО: Приведение обоих значений к строке с trim
              const cleanPin = String(pinInput).trim();
              const expectedPin = String(ADMIN_PIN).trim();

              if (cleanPin === expectedPin) {
                setCurrentView(
                  dbEditorTarget === "norms" ? "dbeditor" : "dbcraneeditor"
                );
                setPinInput("");
                setPinError("");
              } else {
                setPinError("Неверный PIN!");
              }
            }}
          >
            OK
          </button>
          <button
            style={{ ...styles.modalButton, backgroundColor: "#6c757d" }}
            onClick={() => {
              setCurrentView("manager");
              setPinError("");
              setPinInput("");
            }}
          >
            Отмена
          </button>
        </div>
      </div>
    );
  }

  if (currentView === "dbeditor") {
    return (
      <DatabaseEditor
        onBack={() => setCurrentView("manager")}
        currentDb={normsData}
        onSaveDb={setNormsData}
      />
    );
  }

  if (currentView === "dbcraneeditor") {
    return (
      <CraneDatabaseEditor
        onBack={() => setCurrentView("manager")}
        currentDb={craneDb}
        onSaveDb={setCraneDb}
      />
    );
  }

  if (currentView === "editor") {
    return (
      <BlockEditor
        initialData={tempBlockData}
        projectLoadData={currentLoadData}
        craneDb={craneDb}
        onSaveAndBack={handleSaveAndCloseEditor}
        onNextStep={handleStep1Geometry}
        onOpenMezzanineEditor={handleOpenMezzanineEditor}
      />
    );
  }

  if (currentView === "mezzanineeditor") {
    return (
      <MezzanineEditor
        blockData={tempBlockData}
        initialMezzanines={tempBlockData.mezzanines}
        onBack={handleBackFromMezzanine}
      />
    );
  }

  if (currentView === "loadseditor") {
    return (
      <LoadsEditor
        blockName={blocks.find((b) => b.id === editingBlockId)?.name}
        initialLoads={tempBlockData.loads}
        onBack={handleBackFromLoads}
        onNext={handleStep2Loads}
      />
    );
  }

  if (currentView === "gableseditor") {
    return (
      <GableEditor
        blockName={blocks.find((b) => b.id === editingBlockId)?.name}
        geometryData={tempBlockData}
        initialGables={tempBlockData.gables}
        onBack={handleBackFromGables}
        onCalculate={handleStep3Calculation}
      />
    );
  }

  if (currentView === "bimviewer") {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h1>🎉 Модель построена!</h1>
        <button onClick={() => setCurrentView("manager")}>
          Вернуться к проектам
        </button>
      </div>
    );
  }

  if (currentView === "projectsetup") {
    return (
      <div style={styles.setupContainer}>
        <div style={styles.setupCard}>
          <h2 style={styles.setupTitle}>⚙️ Настройка проекта</h2>

          {!isCodeSent ? (
            <>
              <div style={styles.tabs}>
                <div
                  style={
                    projectSettings.loadInputMode === "auto"
                      ? styles.tabActive
                      : styles.tab
                  }
                  onClick={() =>
                    setProjectSettings((p) => ({ ...p, loadInputMode: "auto" }))
                  }
                >
                  Автоматический
                </div>
                <div
                  style={
                    projectSettings.loadInputMode === "manual"
                      ? styles.tabActive
                      : styles.tab
                  }
                  onClick={() =>
                    setProjectSettings((p) => ({
                      ...p,
                      loadInputMode: "manual",
                    }))
                  }
                >
                  Ручной ввод
                </div>
              </div>

              {projectSettings.loadInputMode === "auto" ? (
                <>
                  <label style={styles.label}>Норма</label>
                  <select
                    style={styles.select}
                    name="norm"
                    value={projectSettings.norm}
                    onChange={handleProjectSettingsChange}
                  >
                    {Object.entries(normsData).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.name}
                      </option>
                    ))}
                  </select>

                  <label style={styles.label}>Местоположение</label>
                  <select
                    style={styles.select}
                    name="location"
                    value={projectSettings.location}
                    onChange={handleProjectSettingsChange}
                  >
                    {normsData[projectSettings.norm]?.locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>

                  <label style={styles.label}>Тип местности</label>
                  <select
                    style={styles.select}
                    name="terrain"
                    value={projectSettings.terrain}
                    onChange={handleProjectSettingsChange}
                  >
                    {normsData[projectSettings.norm]?.terrains?.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>

                  <div style={styles.autoResult}>
                    <strong>Нагрузки:</strong>
                    <br />
                    Снег: {currentLoadData.snow} кПа
                    <br />
                    Ветер: {currentLoadData.wind} кПа
                    <br />
                    Сейсмичность: {currentLoadData.seismic} баллов
                  </div>
                </>
              ) : (
                <>
                  <label style={styles.label}>
                    Снеговая нагрузка (кПа) и γ
                  </label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                      marginBottom: "10px",
                    }}
                  >
                    <input
                      style={styles.input}
                      type="number"
                      step="0.01"
                      name="manualSnow"
                      value={projectSettings.manualSnow}
                      onChange={handleProjectSettingsChange}
                      placeholder="0.5"
                    />
                    <input
                      style={styles.input}
                      type="number"
                      step="0.01"
                      name="gammaSnow"
                      value={projectSettings.gammaSnow}
                      onChange={handleProjectSettingsChange}
                      placeholder="γ (напр. 1.4)"
                    />
                  </div>

                  <label style={styles.label}>
                    Ветровая нагрузка (кПа) и γ
                  </label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                      marginBottom: "10px",
                    }}
                  >
                    <input
                      style={styles.input}
                      type="number"
                      step="0.01"
                      name="manualWind"
                      value={projectSettings.manualWind}
                      onChange={handleProjectSettingsChange}
                      placeholder="0.23"
                    />
                    <input
                      style={styles.input}
                      type="number"
                      step="0.01"
                      name="gammaWind"
                      value={projectSettings.gammaWind}
                      onChange={handleProjectSettingsChange}
                      placeholder="γ (напр. 1.4)"
                    />
                  </div>

                  <label style={styles.label}>Сейсмичность (баллы)</label>
                  <input
                    style={styles.input}
                    type="number"
                    name="manualSeismic"
                    value={projectSettings.manualSeismic}
                    onChange={handleProjectSettingsChange}
                    placeholder="0"
                  />
                </>
              )}

              <div style={styles.setupSectionTitle}>2. Регистрация</div>

              <label style={styles.label}>Имя</label>
              <input
                style={styles.input}
                type="text"
                name="userName"
                value={projectSettings.userName}
                onChange={handleProjectSettingsChange}
                placeholder="Иван Иванов"
              />

              <label style={styles.label}>E-mail</label>
              <input
                style={styles.input}
                type="email"
                name="userEmail"
                value={projectSettings.userEmail}
                onChange={handleProjectSettingsChange}
                placeholder="email@example.com"
              />

              {!isEmailJsReady && (
                <div style={styles.warningBox}>⏳ Загрузка EmailJS...</div>
              )}

              <button
                style={styles.primaryButton}
                onClick={handleRegistration}
                disabled={isSending || !isEmailJsReady}
              >
                {isSending ? "Отправка..." : "Получить код"}
              </button>

              <button
                style={{ ...styles.secondaryButton, marginTop: "10px", width: "100%" }}
                onClick={() => setCurrentView("quickestimator")}
              >
                💰 Быстрый расчёт (QuickEstimator)
              </button>
            </>
          ) : (
            <>
              <div style={{ textAlign: "center" }}>
                <div style={{ marginBottom: "20px" }}>
                  Код отправлен на: <b>{verifiedEmail}</b>
                </div>

                {projectSettings.userEmail !== verifiedEmail && (
                  <div style={styles.errorBox}>
                    ⚠️ Email был изменен! Код отправлен на {verifiedEmail}.
                    Запросите новый код.
                  </div>
                )}

                <input
                  style={{ ...styles.pinInput, border: "2px solid #007bff" }}
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  maxLength="4"
                  placeholder="0000"
                />

                <button style={styles.primaryButton} onClick={handleVerifyCode}>
                  Подтвердить
                </button>

                <button
                  style={styles.secondaryButton}
                  onClick={handleResendEmail}
                >
                  Изменить Email
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.managerContainer}>
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          marginBottom: "10px",
          gap: "10px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "15px",
            flexWrap: "wrap",
          }}
        >
          <h2>📐 Менеджер блоков</h2>
          <span
            style={styles.backLink}
            onClick={() => setCurrentView("projectsetup")}
          >
            ← Настройки
          </span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
          <button
            style={{
              ...styles.dbButton,
              backgroundColor: "#fff3cd",
              border: "1px solid #ffeeba",
              fontWeight: "bold",
            }}
            onClick={() => setCurrentView("quickestimator")}
          >
            💰 Оценка
          </button>
          <button
            style={styles.dbButton}
            onClick={() => setCurrentView("database")}
          >
            📁 Проекты
          </button>
          <button
            style={styles.dbButton}
            onClick={() => {
              setDbEditorTarget("norms");
              setCurrentView("pinprompt");
            }}
          >
            📋 Нормы
          </button>
          <button
            style={styles.dbButton}
            onClick={() => {
              setDbEditorTarget("cranes");
              setCurrentView("pinprompt");
            }}
          >
            🏗️ Краны
          </button>
        </div>
      </div>

      <div style={styles.mainLayout}>
        <div style={styles.leftColumn}>
          {masterPlanLayout.errorMessages.map((e, i) => (
            <div key={i} style={styles.errorBox}>
              {e}
            </div>
          ))}

          <div style={styles.blockCardsContainer}>
            {blocks.map((block) => (
              <div key={block.id} style={styles.blockCard}>
                <div style={styles.blockCardHeader}>
                  <strong>{block.name}</strong>
                  <div style={styles.headerButtons}>
                    <button
                      style={styles.rotateButton}
                      onClick={() => handleRotateBlock(block.id)}
                    >
                      ↻
                    </button>
                    <button
                      style={styles.editButton}
                      onClick={() => startEditing(block.id)}
                    >
                      ✏️
                    </button>
                    {block.id !== 1 && (
                      <button
                        style={styles.deleteButton}
                        onClick={() => handleDeleteBlock(block.id)}
                      >
                        X
                      </button>
                    )}
                  </div>
                </div>

                <div style={styles.blockCardBody}>
                  <label>Ширина (W)</label>
                  <input
                    type="number"
                    style={styles.input}
                    value={block.data.generalData.blockWidth}
                    onChange={(e) =>
                      handleBlockChange(block.id, "w", e.target.value)
                    }
                  />

                  <label>Длина (L)</label>
                  <input
                    type="number"
                    style={styles.input}
                    value={block.data.generalData.blockLength}
                    onChange={(e) =>
                      handleBlockChange(block.id, "l", e.target.value)
                    }
                  />

                  <label>Высота (H)</label>
                  <input
                    type="number"
                    style={styles.input}
                    value={block.data.generalData.blockHeight}
                    onChange={(e) =>
                      handleBlockChange(block.id, "h", e.target.value)
                    }
                  />

                  {block.id !== 1 && (
                    <>
                      <hr
                        style={{
                          gridColumn: "1 / -1",
                          border: 0,
                          borderTop: "1px solid #ccc",
                          margin: "5px 0",
                        }}
                      />

                      <label style={styles.label}>К блоку</label>
                      <select
                        style={styles.select}
                        value={block.adj.parentId}
                        onChange={(e) =>
                          handleBlockChange(
                            block.id,
                            "parentId",
                            e.target.value
                          )
                        }
                      >
                        {blocks
                          .filter((b) => b.id !== block.id)
                          .map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                      </select>

                      <label style={styles.label}>Сторона род.</label>
                      <select
                        style={styles.select}
                        value={block.adj.parentSide || "B"}
                        onChange={(e) =>
                          handleBlockChange(
                            block.id,
                            "parentSide",
                            e.target.value
                          )
                        }
                      >
                        {SIDES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>

                      <label style={styles.label}>Моя сторона</label>
                      <select
                        style={styles.select}
                        value={block.adj.mySide || "A"}
                        onChange={(e) =>
                          handleBlockChange(block.id, "mySide", e.target.value)
                        }
                      >
                        {SIDES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>

                      <label style={styles.label}>Расстояние</label>
                      <input
                        type="number"
                        style={styles.input}
                        value={block.adj.distance}
                        onChange={(e) =>
                          handleBlockChange(
                            block.id,
                            "distance",
                            e.target.value
                          )
                        }
                      />

                      <label style={styles.label}>Смещение</label>
                      <input
                        type="number"
                        style={styles.input}
                        value={block.adj.offset}
                        onChange={(e) =>
                          handleBlockChange(block.id, "offset", e.target.value)
                        }
                      />
                    </>
                  )}
                </div>
              </div>
            ))}

            <div style={styles.blockCardAdd} onClick={handleAddBlock}>
              +
            </div>
          </div>
        </div>

        <div style={styles.rightColumn}>
          <h3>🗺️ Генплан</h3>
          <MasterPlanView
            blocks={masterPlanLayout.layout}
            collidingIds={masterPlanLayout.collidingIds}
            styles={styles}
          />
        </div>
      </div>
    </div>
  );
}
