import { Component } from 'react'
import { Link } from 'react-router-dom'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('UI error:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">حدث خطأ</h1>
            <p className="text-gray-600 mt-3">
              تعذر عرض هذه الصفحة. يمكنك العودة إلى المتجر والمحاولة مرة أخرى.
            </p>
            <Link
              to="/"
              onClick={() => this.setState({ hasError: false })}
              className="inline-flex mt-6 bg-[#FF385C] hover:bg-[#E61E4D] text-white font-semibold px-5 py-3 rounded-xl"
            >
              العودة إلى المتجر
            </Link>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
