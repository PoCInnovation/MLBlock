import { useState, useRef, useEffect, CSSProperties } from 'react';
import SiteLayout from '../components/landing/SiteLayout';

type TeamMember = {
    name: string;
    role: string;
    tagline: string;
    color: string;
    linkedin?: string;
};

const TEAM: TeamMember[] = [
    {
        name: 'Ilan',
        role: 'Dev',
        tagline:
            "J'aime autant construire que transmettre, MLBlock fait les deux à la fois.",
        color: '#D97757',
        linkedin: 'https://www.linkedin.com/in/ilan-lp/?skipRedirect=true',
    },
    {
        name: 'Chedli',
        role: 'Dev',
        tagline: '[A REMPLIR PAR Chedli]',
        color: '#B6A0E3',
        linkedin:
            'https://www.linkedin.com/in/chedli-ouaziz-9b756a295/?skipRedirect=true',
    },
    {
        name: 'Ali',
        role: 'Dev',
        tagline: '[A REMPLIR PAR Ali]',
        color: '#7DAFEA',
        linkedin:
            'https://www.linkedin.com/in/ali-bassim-b3956734a/?skipRedirect=true',
    },
    {
        name: 'Sacha',
        role: 'Responsable',
        tagline: '[A REMPLIR PAR Sacha]',
        color: '#66C7B0',
        linkedin:
            'https://www.linkedin.com/in/sacha-henneveux-084052304/?skipRedirect=true',
    },
];

function TeamCard({ name, role, tagline, color, linkedin }: TeamMember) {
    const [photoFailed, setPhotoFailed] = useState(false);
    const [hovered, setHovered] = useState(false);

    const cardStyle: CSSProperties = {
        background: '#251e1a',
        border: `1px solid ${linkedin && hovered ? color + '55' : 'rgba(255,255,255,.06)'}`,
        borderRadius: 20,
        padding: 28,
        display: 'block',
        textDecoration: 'none',
        transition: 'border-color .2s, transform .2s, box-shadow .2s',
        cursor: linkedin ? 'pointer' : 'default',
        transform: linkedin && hovered ? 'translateY(-4px)' : 'none',
        boxShadow: linkedin && hovered ? `0 8px 24px rgba(0,0,0,.3)` : 'none',
    };

    const inner = (
        <>
            <div
                style={{
                    marginBottom: 18,
                    display: 'flex',
                    justifyContent: 'center',
                }}
            >
                {!photoFailed ? (
                    <img
                        src={`/assets/team/${name.toLowerCase()}.png`}
                        alt={name}
                        onError={() => setPhotoFailed(true)}
                        style={{
                            width: 96,
                            height: 96,
                            borderRadius: 24,
                            objectFit: 'cover',
                            display: 'block',
                        }}
                    />
                ) : (
                    <div
                        style={{
                            width: 96,
                            height: 96,
                            borderRadius: 24,
                            background: color,
                            boxShadow: '0 3px 0 rgba(0,0,0,.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <span
                            style={{
                                fontFamily: "'Fredoka', sans-serif",
                                fontWeight: 600,
                                fontSize: 36,
                                color: '#fff',
                            }}
                        >
                            {name[0]}
                        </span>
                    </div>
                )}
            </div>
            <h3
                style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontWeight: 600,
                    fontSize: 21,
                    margin: '0 0 4px',
                    color: '#f0e9e3',
                    textAlign: 'center',
                }}
            >
                {name}
            </h3>
            <p
                style={{
                    color: color,
                    fontSize: 13,
                    fontWeight: 800,
                    margin: '0 0 14px',
                    textTransform: 'uppercase',
                    letterSpacing: '.05em',
                    textAlign: 'center',
                }}
            >
                {role}
            </p>
            <p
                style={{
                    color: '#6f665e',
                    fontSize: 14,
                    fontWeight: 700,
                    margin: 0,
                    fontStyle: 'italic',
                    textAlign: 'center',
                }}
            >
                {tagline}
            </p>
        </>
    );

    if (linkedin) {
        return (
            <a
                href={linkedin}
                target="_blank"
                rel="noopener noreferrer"
                style={cardStyle}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                {inner}
            </a>
        );
    }
    return <div style={cardStyle}>{inner}</div>;
}

function PocLogoSlot({ height }: { height?: number }) {
    const [logoFailed, setLogoFailed] = useState(false);
    if (logoFailed) {
        return (
            <span
                style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontWeight: 700,
                    fontSize: 28,
                    color: '#2d2d2d',
                    letterSpacing: '.04em',
                }}
            >
                PoC
            </span>
        );
    }
    return (
        <img
            src="/assets/poc-logo.png"
            alt="PoC Innovation"
            onError={() => setLogoFailed(true)}
            style={{ height: height ?? 52, width: 'auto', display: 'block' }}
        />
    );
}

function PocSection() {
    const textRef = useRef<HTMLDivElement>(null);
    const [logoHeight, setLogoHeight] = useState<number | undefined>();

    useEffect(() => {
        const el = textRef.current;
        if (!el) return;
        const obs = new ResizeObserver(([e]) =>
            setLogoHeight(e.contentRect.height),
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    return (
        <section
            style={{ maxWidth: 1240, margin: '0 auto', padding: '64px 48px' }}
        >
            <h2
                style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontWeight: 600,
                    fontSize: 34,
                    letterSpacing: '-.01em',
                    margin: '0 0 18px',
                }}
            >
                Le projet, porté par PoC Innovation
            </h2>
            <div
                style={{
                    borderRadius: 20,
                    background: '#fff',
                    padding: '32px 36px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 36,
                }}
            >
                <div
                    style={{
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <PocLogoSlot height={logoHeight} />
                </div>
                <div
                    ref={textRef}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 20,
                    }}
                >
                    <p
                        style={{
                            fontSize: 16,
                            lineHeight: 1.65,
                            color: '#2d2d2d',
                            fontWeight: 600,
                            margin: 0,
                        }}
                    >
                        MLBlock est un projet officiel de PoC Innovation, le centre de R&D étudiant d'Epitech. Fondé en 2017, ce centre réunit une quarantaine d'étudiants qui travaillent sur des projets open source autour de l'IA, la sécurité, la santé, l'AR/VR, le hardware et le software, à travers ateliers, bootcamps et hackathons.
                    </p>
                    <div>
                        <a
                            className="poc-btn"
                            href="https://poc-innovation.fr/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Voir le site de PoC Innovation
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default function AboutPage() {
    return (
        <SiteLayout>
            <section
                style={{
                    maxWidth: 1240,
                    margin: '0 auto',
                    padding: '64px 48px 0',
                }}
            >
                <h1
                    style={{
                        fontFamily: "'Fredoka', sans-serif",
                        fontWeight: 600,
                        fontSize: 46,
                        letterSpacing: '-.02em',
                        margin: '0 0 18px',
                    }}
                >
                    Qui sommes nous
                </h1>
                <h2
                    style={{
                        fontFamily: "'Fredoka', sans-serif",
                        fontWeight: 600,
                        fontSize: 28,
                        margin: '0 0 14px',
                        color: '#f0e9e3',
                    }}
                >
                    Pourquoi MLBlock
                </h2>
                <p
                    style={{
                        fontSize: 17,
                        lineHeight: 1.65,
                        color: '#b7ada3',
                        maxWidth: 680,
                        margin: 0,
                        fontWeight: 600,
                    }}
                >
                    MLBlock existe pour que des élèves comprennent visuellement comment fonctionne un pipeline d'IA, sans écrire de code.
                </p>
            </section>

            <section
                style={{
                    background: '#1f1916',
                    borderTop: '1px solid rgba(255,255,255,.05)',
                    marginTop: 56,
                }}
            >
                <div
                    style={{
                        maxWidth: 1240,
                        margin: '0 auto',
                        padding: '64px 48px',
                    }}
                >
                    <h2
                        style={{
                            fontFamily: "'Fredoka', sans-serif",
                            fontWeight: 600,
                            fontSize: 34,
                            letterSpacing: '-.01em',
                            margin: '0 0 8px',
                        }}
                    >
                        L'équipe
                    </h2>
                    <p
                        style={{
                            color: '#b7ada3',
                            fontSize: 17,
                            fontWeight: 600,
                            margin: '0 0 44px',
                        }}
                    >
                        Quatre étudiants Epitech derrière le projet.
                    </p>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: 22,
                        }}
                    >
                        {TEAM.map((m) => (
                            <TeamCard key={m.name} {...m} />
                        ))}
                    </div>
                </div>
            </section>

            <PocSection />
        </SiteLayout>
    );
}
