import React from 'react'

interface State {
  hasError: boolean
}

class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  constructor(props: React.PropsWithChildren) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: any, info: any) {
    console.error('[ErrorBoundary] erro capturado', error, info)
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16 }}>
          <h1>Ocorreu um erro.</h1>
          <button onClick={this.handleReload}>Tentar novamente</button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
