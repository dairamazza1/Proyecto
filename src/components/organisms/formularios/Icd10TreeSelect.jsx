import { useMemo, useState } from "react";
import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import {
  getIcd10MentalTreeNodes,
  searchIcd10MentalNodes,
} from "../../../supabase/crudPacientes";

const OTHER_CODE = "OTHER";

const buildByParentMap = (nodes) => {
  const map = new Map();
  (nodes ?? []).forEach((node) => {
    const key = node?.parent_code ?? "__ROOT__";
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(node);
  });
  return map;
};

const formatNodeLabel = (node) => `${node?.code ?? ""} - ${node?.description ?? ""}`;

export function Icd10TreeSelect({
  value,
  onChange,
  label = "Diagnostico",
  error = "",
  disabled = false,
  allowOther = true,
  icono = null,
}) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expanded, setExpanded] = useState(() => new Set());

  const { data: nodes = [], isLoading } = useQuery({
    queryKey: ["icd10MentalTree"],
    queryFn: getIcd10MentalTreeNodes,
    refetchOnWindowFocus: false,
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ["icd10MentalSearch", searchTerm],
    queryFn: () => searchIcd10MentalNodes({ term: searchTerm, limit: 30 }),
    enabled: searchTerm.trim().length >= 2,
    refetchOnWindowFocus: false,
  });

  const byParent = useMemo(() => buildByParentMap(nodes), [nodes]);
  const rootNodes = byParent.get("__ROOT__") ?? [];

  const selectedLabel = useMemo(() => {
    if (!value) return "-";
    if (value?.code === OTHER_CODE) return "Otro (texto libre)";
    return formatNodeLabel(value);
  }, [value]);

  const toggleExpanded = (code) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const selectNode = (node) => {
    onChange?.({
      code: node?.code ?? "",
      description: node?.description ?? "",
      node_type: node?.node_type ?? "category",
    });
    setOpen(false);
    setSearchTerm("");
  };

  const selectOther = () => {
    onChange?.({
      code: OTHER_CODE,
      description: "Otro",
      node_type: "other",
    });
    setOpen(false);
    setSearchTerm("");
  };

  return (
    <Container>
      {icono ? <span className="fieldIcon">{icono}</span> : null}
      <button
        type="button"
        className={`trigger ${icono ? "withIcon" : ""}`}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
      >
        <span className="label">{label}</span>
        <span className="value">{selectedLabel}</span>
      </button>
      {error ? <p className="error">{error}</p> : null}
      {open && (
        <div className="panel">
          <input
            className="search"
            type="search"
            placeholder="Buscar por codigo o descripcion"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            autoFocus
          />

          {allowOther && (
            <button type="button" className="otherBtn" onClick={selectOther}>
              Otro (texto libre)
            </button>
          )}

          {isLoading ? (
            <div className="placeholder">Cargando codigos...</div>
          ) : searchTerm.trim().length >= 2 ? (
            <div className="searchResults">
              {(searchResults ?? [])
                .filter((node) => node?.node_type !== "block")
                .map((node) => (
                  <button
                    key={node.code}
                    type="button"
                    className="resultItem"
                    onClick={() => selectNode(node)}
                  >
                    {formatNodeLabel(node)}
                  </button>
                ))}
              {!searchResults?.length ? (
                <div className="placeholder">Sin resultados</div>
              ) : null}
            </div>
          ) : (
            <div className="tree">
              {rootNodes.map((block) => {
                const categories = byParent.get(block.code) ?? [];
                const isBlockOpen = expanded.has(block.code);

                return (
                  <div key={block.code} className="block">
                    <button
                      type="button"
                      className="toggleRow"
                      onClick={() => toggleExpanded(block.code)}
                    >
                      <span>{isBlockOpen ? "v" : ">"}</span>
                      <span>{formatNodeLabel(block)}</span>
                    </button>
                    {isBlockOpen && (
                      <div className="categoryList">
                        {categories.map((category) => {
                          const children = byParent.get(category.code) ?? [];
                          const isCategoryOpen = expanded.has(category.code);

                          return (
                            <div key={category.code} className="category">
                              <div className="categoryHeader">
                                <button
                                  type="button"
                                  className="toggleRow small"
                                  onClick={() => toggleExpanded(category.code)}
                                >
                                  <span>{isCategoryOpen ? "v" : ">"}</span>
                                  <span>{category.code}</span>
                                </button>
                                <button
                                  type="button"
                                  className="categoryLabelBtn"
                                  onClick={() => selectNode(category)}
                                >
                                  {category.description}
                                </button>
                              </div>
                              {isCategoryOpen && children.length > 0 && (
                                <div className="subList">
                                  {children.map((sub) => (
                                    <button
                                      key={sub.code}
                                      type="button"
                                      className="subItem"
                                      onClick={() => selectNode(sub)}
                                    >
                                      {formatNodeLabel(sub)}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Container>
  );
}

const Container = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;

  .fieldIcon {
    flex: 0 0 auto;
    color: #5396ac;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .trigger {
    width: 100%;
    border: none;
    border-bottom: 2px solid #9b9b9b;
    background: transparent;
    color: ${({ theme }) => theme.text};
    padding: 18px 0 8px;
    text-align: left;
    cursor: pointer;
    display: grid;
    gap: 4px;
    position: relative;
  }

  .trigger:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .label {
    position: absolute;
    top: 0;
    left: 0;
    font-size: 16px;
    color: #9b9b9b;
    pointer-events: none;
  }

  .value {
    min-height: 24px;
    font-weight: 500;
    line-height: 1.3;
    padding-right: 26px;
    overflow-wrap: anywhere;
  }

  .trigger::after {
    content: "v";
    position: absolute;
    right: 0;
    top: 22px;
    color: ${({ theme }) => theme.color1};
    font-weight: 700;
  }

  .trigger:hover {
    border-bottom-color: ${({ theme }) => theme.color1};
  }

  .trigger:focus-visible {
    outline: none;
    border-bottom-width: 1px;
    border-image: linear-gradient(to right, #5396ac, #377b92);
    border-image-slice: 1;
  }

  .trigger:focus-visible .label,
  .trigger:hover .label {
    color: #5396ac;
    font-weight: 700;
  }

  .error {
    color: var(--color-danger);
    margin-top: 6px;
    font-size: 0.85rem;
  }

  .panel {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    z-index: 2600;
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 12px;
    background: ${({ theme }) => theme.bg};
    box-shadow: var(--shadow-elev-2);
    max-height: min(52dvh, 460px);
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    padding: 10px;
    display: grid;
    gap: 8px;
  }

  .search {
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 10px;
    padding: 8px 10px;
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.text};
    outline: none;
  }

  .otherBtn {
    border: 1px dashed ${({ theme }) => theme.color1};
    border-radius: 10px;
    background: transparent;
    color: ${({ theme }) => theme.color1};
    padding: 6px 10px;
    text-align: left;
    cursor: pointer;
    font-weight: 600;
  }

  .placeholder {
    color: ${({ theme }) => theme.textsecundary};
    font-size: 0.9rem;
    padding: 6px 2px;
  }

  .toggleRow {
    width: 100%;
    border: none;
    background: transparent;
    color: ${({ theme }) => theme.text};
    text-align: left;
    cursor: pointer;
    display: flex;
    gap: 8px;
    padding: 4px 2px;
    font-weight: 600;
    border-radius: 8px;
  }

  .toggleRow.small {
    font-weight: 500;
  }

  .toggleRow:hover {
    background: ${({ theme }) => theme.color2};
    color: ${({ theme }) => theme.color1};
  }

  .categoryList {
    padding-left: 16px;
    display: grid;
    gap: 6px;
  }

  .categoryHeader {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 6px;
    align-items: center;
  }

  .categoryLabelBtn {
    border: none;
    border-radius: 8px;
    background: transparent;
    color: ${({ theme }) => theme.text};
    padding: 4px 8px;
    cursor: pointer;
    text-align: left;
    width: 100%;
  }

  .categoryLabelBtn:hover {
    background: ${({ theme }) => theme.color2};
    color: ${({ theme }) => theme.color1};
  }

  .subList {
    display: grid;
    gap: 4px;
    padding-left: 20px;
  }

  .subItem,
  .resultItem {
    border: none;
    background: transparent;
    color: ${({ theme }) => theme.text};
    text-align: left;
    cursor: pointer;
    padding: 6px 8px;
    border-radius: 8px;
  }

  .subItem:hover,
  .resultItem:hover {
    background: ${({ theme }) => theme.color2};
    color: ${({ theme }) => theme.color1};
  }

  .searchResults {
    display: grid;
    gap: 4px;
  }
`;
