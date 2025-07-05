import { ThemeProvider as NextThemesProvider } from "next-themes";

const ThemeProvider = ({ children }: Readonly<React.PropsWithChildren>) => (
  <NextThemesProvider
    attribute="class"
    enableSystem
    disableTransitionOnChange
    enableColorScheme
  >
    {children}
  </NextThemesProvider>
);

export default ThemeProvider;
