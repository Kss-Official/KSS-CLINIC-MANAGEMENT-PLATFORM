import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8faf9',
            padding: '24px',
            fontFamily: "'Manrope', 'Plus Jakarta Sans', sans-serif",
            color: '#1e293b',
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              width: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '36px 32px',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px auto',
                fontSize: '28px',
              }}
            >
              ⚠️
            </div>

            <h2
              style={{
                fontSize: '22px',
                fontWeight: '800',
                color: '#0f172a',
                marginBottom: '8px',
              }}
            >
              Something went unexpected
            </h2>

            <p
              style={{
                fontSize: '14px',
                color: '#64748b',
                lineHeight: 1.6,
                marginBottom: '24px',
              }}
            >
              An unexpected error occurred while displaying this page. Your data is safe. You can reload this page or return to the main homepage.
            </p>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginBottom: '16px',
              }}
            >
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  padding: '11px 22px',
                  borderRadius: '9999px',
                  backgroundColor: '#265e38',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                Back to Home
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  padding: '11px 22px',
                  borderRadius: '9999px',
                  backgroundColor: '#ffffff',
                  color: '#265e38',
                  border: '1.5px solid #265e38',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                Reload Page
              </button>
            </div>

            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <details
                style={{
                  marginTop: '16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                <summary style={{ fontWeight: '600', marginBottom: '6px' }}>
                  Technical details
                </summary>
                <pre
                  style={{
                    backgroundColor: '#f1f5f9',
                    padding: '10px',
                    borderRadius: '8px',
                    overflowX: 'auto',
                    color: '#dc2626',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                  }}
                >
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
