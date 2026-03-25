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

interface WelcomeInviteProps {
  firstName: string;
  inviteUrl: string;
}

export function WelcomeInvite({ firstName, inviteUrl }: WelcomeInviteProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Coros — set your password to get started</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Text style={heading}>Welcome to Coros</Text>
            <Text style={paragraph}>Hi {firstName},</Text>
            <Text style={paragraph}>
              You've been added to your organization. Click the button below to
              set your password and sign in.
            </Text>
            <Button style={button} href={inviteUrl}>
              Set your password
            </Button>
            <Text style={small}>
              This link expires in 7 days. If you didn't expect this email,
              you can safely ignore it.
            </Text>
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

const small = {
  fontSize: '14px',
  color: '#718096',
  margin: '24px 0 0',
};
