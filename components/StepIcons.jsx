// Íconos de línea para "Así de fácil": trazo fino en tinta + un detalle en color de acento.
const Svg = ({ children }) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const accent = { stroke: "var(--accent)" };

export const BrowseIcon = () => (
  <Svg>
    <rect x="9" y="6" width="22" height="32" rx="3" />
    <path d="M14 13h12M14 18h8M14 23h10" />
    <circle cx="31" cy="31" r="6.5" fill="#fff" style={accent} />
    <path d="m35.8 35.8 4.2 4.2" style={accent} />
  </Svg>
);

export const AddIcon = () => (
  <Svg>
    <path d="M10 17h28l-2 21.5a2.5 2.5 0 0 1-2.5 2.3h-19a2.5 2.5 0 0 1-2.5-2.3L10 17Z" />
    <path d="M17.5 17v-3a6.5 6.5 0 0 1 13 0v3" />
    <path d="M24 24v10M19 29h10" style={accent} />
  </Svg>
);

export const SendIcon = () => (
  <Svg>
    <path d="M24 8c-9.4 0-16 6.3-16 14.2 0 4.2 1.9 7.9 5 10.5L11.5 40l7.6-3.6c1.5.4 3.2.6 4.9.6 9.4 0 16-6.3 16-14.8S33.4 8 24 8Z" />
    <path d="M17 22.5h.01M24 22.5h.01M31 22.5h.01" strokeWidth="3" style={accent} />
  </Svg>
);

export const ConfirmIcon = () => (
  <Svg>
    <path d="M7 16 22 9l15 7v16L22 39 7 32V16Z" />
    <path d="M7 16l15 7 15-7M22 23v16" />
    <circle cx="35.5" cy="34.5" r="7" fill="#fff" style={accent} />
    <path d="m32.4 34.6 2.2 2.2 4-4.2" style={accent} />
  </Svg>
);
