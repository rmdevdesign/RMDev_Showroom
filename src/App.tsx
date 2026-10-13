import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  defaults,
  dimensions,
  finishes,
  frontFinishes,
  feetFinishes,
  reference,
  restore,
  storageKey,
  type Config,
} from "./config";
import FinishSwatch from "./FinishSwatch";
import Icon from "./Icon";
const Scene = lazy(() => import("./Scene"));
export default function App() {
  const [config, setConfig] = useState<Config>(restore),
    [step, setStep] = useState(0),
    [rotate, setRotate] = useState(false),
    [reset, setReset] = useState(0),
    [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const capture = useRef<(() => string) | null>(null);
  const d = dimensions(config);
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(config));
    } catch {
      /* Storage is optional. */
    }
  }, [config]);
  const change = <K extends keyof Config>(key: K, value: Config[K]) =>
    setConfig((c) => ({ ...c, [key]: value }));
  async function pdf() {
    setBusy(true);
    setMessage("");
    try {
      const { exportPdf } = await import("./exportPdf");
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      const snapshot = capture.current?.();
      await exportPdf(config, snapshot);
      setMessage("Fiche PDF téléchargée.");
    } catch {
      setMessage("Le PDF n’a pas pu être généré. Réessayez.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="app">
      <header>
        <a className="wordmark" href="#" aria-label="FORME accueil">
          FORME<span>.</span>
        </a>
        <span className="header-caption">Mobilier modulaire</span>
        <a className="studio-link" href="https://rmdev.design">
          <b>RM Dev Design</b>
          <Icon name="external" />
        </a>
      </header>
      <main>
        <section className="stage" aria-label="Aperçu du mobilier en 3D">
          <div className="stage-heading">
            <span className="eyebrow">BIBLIOTHÈQUE MODULAIRE</span>
            <h1>
              Module 01<span>.</span>
            </h1>
            <p>
              {config.columns} colonnes · {config.rows} niveaux
            </p>
          </div>
          <div className="scene">
            <Suspense
              fallback={
                <div className="scene-error">Préparation de votre espace…</div>
              }
            >
              <Scene
                config={config}
                rotate={rotate}
                reset={reset}
                onCanvas={(_element, captureScene) => {
                  capture.current = captureScene;
                }}
              />
            </Suspense>
          </div>
          <div className="scene-badge">M–01</div>
          <div className="stage-bottom">
            <div>
              <strong>
                {d.width} × {d.height} × {d.depth} <small>cm</small>
              </strong>
              <span>Largeur × hauteur × profondeur</span>
            </div>
            <div className="view-tools">
              <button
                onClick={() => setRotate((v) => !v)}
                aria-pressed={rotate}
                aria-label="Rotation automatique"
              >
                <Icon name={rotate ? "pause" : "rotate"} />
              </button>
              <button
                onClick={() => setReset((v) => v + 1)}
                aria-label="Recentrer la vue"
              >
                <Icon name="center" />
              </button>
            </div>
          </div>
          <p className="gesture">Glissez pour explorer · Défilez pour zoomer</p>
        </section>
        <aside>
          <div className="panel-intro">
            <span className="eyebrow">VOTRE MODULE</span>
            <h2>Configuration</h2>
            <p>Format, matières et équipements.</p>
          </div>
          <nav aria-label="Étapes de configuration">
            {["Format", "Finitions", "Détails"].map((label, i) => (
              <button
                key={label}
                className={step === i ? "active" : ""}
                aria-current={step === i ? "step" : undefined}
                onClick={() => setStep(i)}
              >
                <span>0{i + 1}</span>
                {label}
              </button>
            ))}
          </nav>
          <div className="options">
            {step === 0 ? (
              <>
                <div className="section-label">
                  <h3>Largeur</h3>
                  <span>{d.width} cm</span>
                </div>
                <div className="choice-grid">
                  {[2, 3, 4].map((n) => (
                    <button
                      key={n}
                      aria-pressed={config.columns === n}
                      onClick={() => change("columns", n)}
                    >
                      <span
                        className="shelf-icon"
                        style={{ gridTemplateColumns: "repeat(" + n + ",1fr)" }}
                      >
                        {Array.from({ length: n }, (_, i) => (
                          <i key={i} />
                        ))}
                      </span>
                      <b>{n * 40 + 4} cm</b>
                      <small>{n} colonnes</small>
                    </button>
                  ))}
                </div>
                <div className="section-label">
                  <h3>Hauteur</h3>
                </div>
                <div className="segmented">
                  {[2, 3, 4].map((n) => (
                    <button
                      key={n}
                      aria-pressed={config.rows === n}
                      onClick={() => change("rows", n)}
                    >
                      {n} niveaux
                    </button>
                  ))}
                </div>
                <p className="hint">Cases de 40 × 36 cm. Panneaux de 35 mm.</p>
              </>
            ) : step === 1 ? (
              <>
                {(["finish", "front"] as const).map((key) => (
                  <div key={key}>
                    <div className="section-label">
                      <h3>{key === "finish" ? "Structure" : "Façades"}</h3>
                      <span>
                        {
                          (key === "front" ? frontFinishes : finishes).find(
                            (f) => f.id === config[key],
                          )!.name
                        }
                      </span>
                    </div>
                    <div className="swatches">
                      {(key === "front" ? frontFinishes : finishes).map((f) => (
                        <button
                          key={f.id}
                          aria-label={
                            (key === "finish" ? "Structure" : "Façades") +
                            " " +
                            f.name
                          }
                          aria-pressed={config[key] === f.id}
                          onClick={() => change(key, f.id)}
                        >
                          <FinishSwatch
                            id={f.id}
                            color={f.color}
                            wood={
                              key === "finish" &&
                              ["oak", "walnut", "chalk"].includes(f.id)
                            }
                          />
                          {f.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {config.legs && (
                  <div className="feet-colors">
                    <div className="section-label">
                      <h3>Couleur des pieds</h3>
                      <span>
                        {
                          feetFinishes.find(
                            (f) => f.id === (config.feet ?? "graphite"),
                          )!.name
                        }
                      </span>
                    </div>
                    <div className="swatches">
                      {feetFinishes.map((f) => (
                        <button
                          key={f.id}
                          aria-label={"Pieds " + f.name}
                          aria-pressed={(config.feet ?? "graphite") === f.id}
                          onClick={() => change("feet", f.id)}
                        >
                          <FinishSwatch id={f.id} color={f.color} />
                          {f.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <p className="hint">
                  Les teintes sont indicatives. Activez les façades dans Détails
                  pour les voir en 3D.
                </p>
              </>
            ) : (
              <>
                <label className="toggle-row">
                  <span>
                    <b>Façades fermées</b>
                    <small>Portes sur la rangée inférieure.</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={config.doors}
                    onChange={(e) => change("doors", e.target.checked)}
                  />
                </label>
                <label className="toggle-row">
                  <span>
                    <b>Objets décoratifs</b>
                    <small>Livres, vase et plante.</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={config.decor}
                    onChange={(e) => change("decor", e.target.checked)}
                  />
                </label>
                <label className="toggle-row">
                  <span>
                    <b>Pieds en métal</b>
                    <small>
                      Métal, hauteur 8 cm. Sans pieds : socle de 4 cm.
                    </small>
                  </span>
                  <input
                    type="checkbox"
                    checked={config.legs}
                    onChange={(e) => change("legs", e.target.checked)}
                  />
                </label>
                <p className="hint">
                  Les accessoires se répartissent automatiquement dans les cases
                  ouvertes selon le format choisi.
                </p>
              </>
            )}
          </div>
          <div className="panel-footer">
            <div className="summary">
              <span>Votre composition</span>
              <b>
                {config.columns} colonnes · {config.rows} niveaux
              </b>
            </div>
            <button
              className="primary"
              disabled={busy}
              onClick={() => void pdf()}
            >
              {busy ? "Préparation…" : "Fiche de configuration PDF"}
              <Icon name="download" />
            </button>
            <button
              className="reset-config"
              onClick={() => {
                setConfig({ ...defaults });
                setStep(0);
                setRotate(false);
                setReset((v) => v + 1);
                setMessage("");
              }}
            >
              <Icon name="reset" />
              Repartir de zéro
            </button>
            <p className="status" role="status">
              {message}
            </p>
          </div>
        </aside>
      </main>
      <footer>
        <span>
          <b>SHOWROOM</b> · Marque et produit fictifs
        </span>
        <span>Design & développement par RM Dev Design</span>
        <span className="reference">{reference(config)}</span>
      </footer>
    </div>
  );
}
