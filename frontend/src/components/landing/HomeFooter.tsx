import { theme } from '../../theme'

export default function HomeFooter() {
    return (
        <footer
            style={{
                maxWidth: 1240,
                margin: '0 auto',
                padding: '34px 48px 56px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: theme.color.textMuted,
                fontSize: 14,
                fontWeight: 700,
            }}
        >
            <span>© 2026 PoC Innovation</span>
        </footer>
    );
}
