import { createGlobalStyle } from "styled-components";
export const GlobalStyles = createGlobalStyle`
    :root{
        /* Paleta detalles */
        --palette-detail-0: ${({ theme }) => theme.vars?.["--palette-detail-0"]};
        --palette-detail-1: ${({ theme }) => theme.vars?.["--palette-detail-1"]};
        --palette-detail-2: ${({ theme }) => theme.vars?.["--palette-detail-2"]};
        --palette-detail-3: ${({ theme }) => theme.vars?.["--palette-detail-3"]};
        --palette-detail-4: ${({ theme }) => theme.vars?.["--palette-detail-4"]};
        --palette-detail-5: ${({ theme }) => theme.vars?.["--palette-detail-5"]};
        --palette-detail-6: ${({ theme }) => theme.vars?.["--palette-detail-6"]};
        --palette-detail-7: ${({ theme }) => theme.vars?.["--palette-detail-7"]};
        --palette-detail-8: ${({ theme }) => theme.vars?.["--palette-detail-8"]};
        --palette-detail-9: ${({ theme }) => theme.vars?.["--palette-detail-9"]};
        --palette-detail-10: ${({ theme }) => theme.vars?.["--palette-detail-10"]};
        --palette-detail-11: ${({ theme }) => theme.vars?.["--palette-detail-11"]};

        /* Sombras paleta detalles */
        --palette-shadow-detail-1: ${({ theme }) => theme.vars?.["--palette-shadow-detail-1"]};
        --palette-shadow-detail-2: ${({ theme }) => theme.vars?.["--palette-shadow-detail-2"]};
        --palette-shadow-detail-3: ${({ theme }) => theme.vars?.["--palette-shadow-detail-3"]};
        --palette-shadow-detail-4: ${({ theme }) => theme.vars?.["--palette-shadow-detail-4"]};
        --palette-shadow-detail-5: ${({ theme }) => theme.vars?.["--palette-shadow-detail-5"]};
        --palette-shadow-detail-6: ${({ theme }) => theme.vars?.["--palette-shadow-detail-6"]};
        --palette-shadow-detail-7: ${({ theme }) => theme.vars?.["--palette-shadow-detail-7"]};
        --palette-shadow-detail-8: ${({ theme }) => theme.vars?.["--palette-shadow-detail-8"]};
        --palette-shadow-detail-9: ${({ theme }) => theme.vars?.["--palette-shadow-detail-9"]};
        --palette-shadow-detail-10: ${({ theme }) => theme.vars?.["--palette-shadow-detail-10"]};
        --palette-shadow-detail-11: ${({ theme }) => theme.vars?.["--palette-shadow-detail-11"]};

        /* Tokens semánticos */
        --color-primary: ${({ theme }) => theme.vars?.["--color-primary"]};

        --bg-page: ${({ theme }) => theme.vars?.["--bg-page"]};
        --bg-surface: ${({ theme }) => theme.vars?.["--bg-surface"]};
        --bg-surface-muted: ${({ theme }) => theme.vars?.["--bg-surface-muted"]};
        --bg-sidebar-rail: ${({ theme }) => theme.vars?.["--bg-sidebar-rail"]};

        --text-primary: ${({ theme }) => theme.vars?.["--text-primary"]};
        --text-secondary: ${({ theme }) => theme.vars?.["--text-secondary"]};

        --border-subtle: ${({ theme }) => theme.vars?.["--border-subtle"]};
        --border-strong: ${({ theme }) => theme.vars?.["--border-strong"]};

        --color-accent: ${({ theme }) => theme.vars?.["--color-accent"]};
        --color-accent-strong: ${({ theme }) => theme.vars?.["--color-accent-strong"]};
        --color-accent-soft: ${({ theme }) => theme.vars?.["--color-accent-soft"]};

        --color-danger: ${({ theme }) => theme.vars?.["--color-danger"]};
        --color-success: ${({ theme }) => theme.vars?.["--color-success"]};
        --color-warning: ${({ theme }) => theme.vars?.["--color-warning"]};

        --bg-success-soft: ${({ theme }) => theme.vars?.["--bg-success-soft"]};
        --bg-danger-soft: ${({ theme }) => theme.vars?.["--bg-danger-soft"]};
        --bg-accent-soft: ${({ theme }) => theme.vars?.["--bg-accent-soft"]};
        --bg-accent-soft-strong: ${({ theme }) => theme.vars?.["--bg-accent-soft-strong"]};

        --bg-warning-soft: ${({ theme }) => theme.vars?.["--bg-warning-soft"]};
        --border-warning-soft: ${({ theme }) => theme.vars?.["--border-warning-soft"]};

        --overlay-backdrop: ${({ theme }) => theme.vars?.["--overlay-backdrop"]};
        --overlay-backdrop-soft: ${({ theme }) => theme.vars?.["--overlay-backdrop-soft"]};
        --shadow-elev-1: ${({ theme }) => theme.vars?.["--shadow-elev-1"]};
        --shadow-elev-2: ${({ theme }) => theme.vars?.["--shadow-elev-2"]};
    }

    *, *::before, *::after{
        box-sizing: border-box;
    }
    body{
        margin: 0;
        padding: 0;
        background: ${({theme})=>theme.bgtotal};
        color: ${({theme})=>theme.text};
        font-family: "Poppins", sans-serif;
    }
`;


