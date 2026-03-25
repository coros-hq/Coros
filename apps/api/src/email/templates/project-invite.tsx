import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface ProjectInviteProps {
  projectName: string;
  projectUrl: string;
}

export function ProjectInvite({ projectName, projectUrl }: ProjectInviteProps) {
  return (
    <Html>
      <Head />
      <Preview>You've been added to {projectName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Text style={heading}>Added to a project</Text>
            <Text style={paragraph}>
              You've been added to <strong>{projectName}</strong>.
            </Text>
            <Text style={paragraph}>
              Click the button below to open the project in Coros.
            </Text>
            <Button style={button} href={projectUrl}>
              View project
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  padding: '40px 20px',
};

const box = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  padding: '32px',
  maxWidth: '480px',
  margin: '0 auto',
};

const heading = {
  fontSize: '24px',
  fontWeight: '600' as const,
  color: '#1a1a1a',
  margin: '0 0 24px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#4a5568',
  margin: '0 0 16px',
};

const button = {
  backgroundColor: '#7c3aed',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600' as const,
  padding: '12px 24px',
  borderRadius: '6px',
  display: 'inline-block',
  margin: '16px 0',
};
