import { useState, useRef } from 'react';
import SiteLayout from '../components/landing/SiteLayout';
import { Card, Grid, Stack, VStack, HStack } from '@astryxdesign/core';
import { Heading, Text } from '@astryxdesign/core/Text';
import { theme } from '../theme';

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

function TeamCard({ name, role, tagline, linkedin }: TeamMember) {
    const [photoFailed, setPhotoFailed] = useState(false);

    const inner = (
        <VStack gap={2} className="text-center">
            <div className="mb-1.5 flex justify-center">
                {!photoFailed ? (
                    <img
                        src={`/assets/team/${name.toLowerCase()}.png`}
                        alt={name}
                        loading="lazy"
                        onError={() => setPhotoFailed(true)}
                        className="w-24 h-24 rounded-3xl object-cover block"
                    />
                ) : (
                    <div className="w-24 h-24 rounded-3xl bg-surface3 flex items-center justify-center">
                        <Heading level={2} className="text-text text-4xl">{name[0]}</Heading>
                    </div>
                )}
            </div>
            <Heading level={4} className="text-center">{name}</Heading>
            <Text type="label" className="uppercase tracking-wider text-center text-status">{role}</Text>
            <Text type="body" color="secondary" className="italic text-center">{tagline}</Text>
        </VStack>
    );

    if (linkedin) {
        return (
            <Card
                className="bg-surface3 border border-white/10 rounded-2xl p-7 block no-underline transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer"
            >
                <a href={linkedin} target="_blank" rel="noopener noreferrer" className="no-underline text-inherit block">
                {inner}
                </a>
            </Card>
        );
    }
    return <Card className="bg-surface3 border border-white/10 rounded-2xl p-7 block">{inner}</Card>;
}

function PocLogoSlot() {
    const [logoFailed, setLogoFailed] = useState(false);
    if (logoFailed) {
        return <Heading level={2} className="text-text-input tracking-wider">PoC</Heading>;
    }
    return (
        <img
            src="/assets/poc-logo.png"
            alt="PoC Innovation"
            onError={() => setLogoFailed(true)}
            className="w-auto block h-12"
        />
    );
}

function PocSection() {
    const textRef = useRef<HTMLDivElement>(null);
    return (
        <Stack className="max-w-7xl mx-auto px-12 py-16">
            <VStack gap={3}>
                <Heading level={2}>Le projet, porté par PoC Innovation</Heading>
                <Card variant="default" padding={4} className="bg-white">
                    <HStack gap={4} className="items-start">
                        <PocLogoSlot />
                        <VStack gap={3} ref={textRef as never}>
                            <Text type="body" className="text-text-input leading-relaxed">MLBlock est un projet officiel de PoC Innovation, le centre de R&D étudiant d'Epitech. Fondé en 2017, ce centre réunit une quarantaine d'étudiants qui travaillent sur des projets open source autour de l'IA, la sécurité, la santé, l'AR/VR, le hardware et le software, à travers ateliers, bootcamps et hackathons.</Text>
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
            <Stack className="max-w-7xl mx-auto px-12 pt-16">
                <VStack gap={3}>
                    <Heading level={1}>Qui sommes nous</Heading>
                    <Heading level={3} className="text-text">Pourquoi MLBlock</Heading>
                    <Text type="body" color="secondary" className="max-w-2xl">MLBlock existe pour que des élèves comprennent visuellement comment fonctionne un pipeline d'IA, sans écrire de code.</Text>
                </VStack>
            </Stack>

            <section className="bg-surface border-t border-white/5 mt-14">
                <Stack className="max-w-7xl mx-auto px-12 py-16">
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
