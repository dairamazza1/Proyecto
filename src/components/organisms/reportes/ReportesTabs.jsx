import styled from "styled-components";
import { DeviceMax } from "../../../styles/breakpoints";

export function ReportesTabs({ tabs = [], activeTab, onChange }) {
  return (
    <Tabs>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tab ${activeTab === tab.id ? "active" : ""}`}
          onClick={() => onChange?.(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </Tabs>
  );
}

const Tabs = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 8px;

  @media ${DeviceMax.mobile} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .tab {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    padding: 0 12px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bg};
    color: ${({ theme }) => theme.text};
    font-weight: 600;
    cursor: pointer;
    width: 100%;
    height: 34px;
    min-height: 34px;
    line-height: 1;
    font-size: 0.9rem;
  }

  .tab.active {
    border-color: ${({ theme }) => theme.color1};
    color: ${({ theme }) => theme.color1};
    background: var(--bg-accent-soft);
  }
`;
