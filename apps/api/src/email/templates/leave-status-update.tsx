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
  
  interface LeaveStatusUpdateProps {
    firstName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    status: 'approved' | 'rejected';
    reason?: string;
    leaveUrl: string;
  }
  
  export function LeaveStatusUpdate({
    firstName,
    leaveType,
    startDate,
    endDate,
    status,
    reason,
    leaveUrl,
  }: LeaveStatusUpdateProps) {
    const isApproved = status === 'approved';
  
    return (
      <Html>
        <Head />
        <Preview>
          Your {leaveType} leave request has been {status}
        </Preview>
        <Body style={main}>
          <Container style={container}>
            <Section style={box}>
              <Section style={isApproved ? badgeApproved : badgeRejected}>
                <Text style={badgeText}>
                  {isApproved ? 'Leave Approved' : 'Leave Rejected'}
                </Text>
              </Section>
              <Text style={paragraph}>Hi {firstName},</Text>
              <Text style={paragraph}>
                Your <strong>{leaveType}</strong> leave request from{' '}
                <strong>{startDate}</strong> to <strong>{endDate}</strong> has
                been <strong>{status}</strong>.
              </Text>
              {!isApproved && reason && (
                <Section style={reasonBox}>
                  <Text style={reasonLabel}>Reason</Text>
                  <Text style={reasonText}>{reason}</Text>
                </Section>
              )}
              <Button style={button} href={leaveUrl}>
                View leave requests
              </Button>
              <Text style={small}>
                You received this email because you have a leave request in Coros.
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
  
  const badgeApproved = {
    backgroundColor: '#f0fdf4',
    borderRadius: '6px',
    padding: '12px 16px',
    marginBottom: '24px',
  };
  
  const badgeRejected = {
    backgroundColor: '#fff1f2',
    borderRadius: '6px',
    padding: '12px 16px',
    marginBottom: '24px',
  };
  
  const badgeText = {
    fontSize: '14px',
    fontWeight: '600' as const,
    margin: '0',
    color: '#1a1a1a',
  };
  
  const paragraph = {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#4a5568',
    margin: '0 0 16px',
  };
  
  const reasonBox = {
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    padding: '12px 16px',
    margin: '0 0 16px',
  };
  
  const reasonLabel = {
    fontSize: '12px',
    fontWeight: '600' as const,
    color: '#718096',
    margin: '0 0 4px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  };
  
  const reasonText = {
    fontSize: '14px',
    color: '#4a5568',
    margin: '0',
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