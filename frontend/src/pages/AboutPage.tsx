import { theme } from '../theme'
import { useState, useRef, useEffect, CSSProperties } from 'react';
import SiteLayout from '../components/landing/SiteLayout';
import { Card, Grid, Stack, VStack, HStack } from '@astryxdesign/core';
import { Heading, Text } from '@astryxdesign/core/Text';

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
        tagline: 'Curieux par nature, je construit des outils qui apprennent.',
        color: '#B6A0E3',
        linkedin:
            'https://www.linkedin.com/in/chedli-ouaziz-9b756a295/?skipRedirect=true',
    },
    {
        name: 'Ali',
        role: 'Dev',
        tagline: 'Passionné par le code et l\'IA, je donne vie aux idées.',
        color: '#7DAFEA',
        linkedin:
            'https://www.linkedin.com/in/ali-bassim-b3956734a/?skipRedirect=true',
    },
    {
        name: 'Sacha',
        role: 'Responsable',
        tagline: 'Coordonner l\'équipe pour livrer un projet qui a du sens.',
        color: theme.color.status,
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
        <VStack gap={2} style={{ textAlign: 'center' }}>
            <div
                style={{
                    marginBottom: 6,
                    display: 'flex',
                    justifyContent: 'center',
                }}
            >
                {!photoFailed ? (
                    <img
                        src={`/assets/team/${name.toLowerCase()}.png`}
                        alt={name}
                        loading="lazy"
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
                        <Heading level={2} style={{ color: '#fff', fontSize: 36 }}>{name[0]}</Heading>
                    </div>
                )}
            </div>
            <Heading level={4} style={{ textAlign: 'center' }}>{name}</Heading>
            <Text type="label" style={{ color, textTransform: 'uppercase', letterSpacing: '.05em', textAlign: 'center' }}>{role}</Text>
            <Text type="body" color="secondary" style={{ fontStyle: 'italic', textAlign: 'center' }}>{tagline}</Text>
        </VStack>
    );

    if (linkedin) {
        return (
            <Card
                style={cardStyle}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                <a href={linkedin} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                {inner}
                </a>
            </Card>
        );
    }
    return <Card style={cardStyle}>{inner}</Card>;
}

function PocLogoSlot({ height }: { height?: number }) {
    const [logoFailed, setLogoFailed] = useState(false);
    if (logoFailed) {
        return <Heading level={2} style={{ color: '#2d2d2d', letterSpacing: '.04em' }}>PoC</Heading>;
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
        <Stack style={{ maxWidth: 1240, margin: '0 auto', padding: '64px 48px' }}>
            <VStack gap={3}>
                <Heading level={2}>Le projet, porté par PoC Innovation</Heading>
                <Card variant="default" padding={4} style={{ background: '#fff' }}>
                    <HStack gap={4} style={{ alignItems: 'flex-start' }}>
                        <PocLogoSlot height={logoHeight} />
                        <VStack gap={3} ref={textRef as never}>
                            <Text type="body" style={{ color: '#2d2d2d', lineHeight: 1.65 }}>MLBlock est un projet officiel de PoC Innovation, le centre de R&D étudiant d'Epitech. Fondé en 2017, ce centre réunit une quarantaine d'étudiants qui travaillent sur des projets open source autour de l'IA, la sécurité, la santé, l'AR/VR, le hardware et le software, à travers ateliers, bootcamps et hackathons.</Text>
                            <div>
                                <a className="poc-btn" href="https://poc-innovation.fr/" target="_blank" rel="noopener noreferrer">Voir le site de PoC Innovation</a>
                            </div>
                        </VStack>
                    </HStack>
                </Card>
            </VStack>
        </Stack>
    );
}

export default function AboutPage() {
    return (
        <SiteLayout>
            <Stack style={{ maxWidth: 1240, margin: '0 auto', padding: '64px 48px 0' }}>
                <VStack gap={3}>
                    <Heading level={1}>Qui sommes nous</Heading>
                    <Heading level={3} style={{ color: '#f0e9e3' }}>Pourquoi MLBlock</Heading>
                    <Text type="body" color="secondary" style={{ maxWidth: 680 }}>MLBlock existe pour que des élèves comprennent visuellement comment fonctionne un pipeline d'IA, sans écrire de code.</Text>
                </VStack>
            </Stack>

            <section style={{ background: '#1f1916', borderTop: '1px solid rgba(255,255,255,.05)', marginTop: 56 }}>
                <Stack style={{ maxWidth: 1240, margin: '0 auto', padding: '64px 48px' }}>
                    <VStack gap={3}>
                        <Heading level={2}>L'équipe</Heading>
                        <Text type="body" color="secondary">Quatre étudiants Epitech derrière le projet.</Text>
                        <Grid columns={4} gap={3}>
                            {TEAM.map((m) => (
                                <TeamCard key={m.name} {...m} />
                            ))}
                        </Grid>
                    </VStack>
                </Stack>
            </section>

            <PocSection />
        </SiteLayout>
    );
}
