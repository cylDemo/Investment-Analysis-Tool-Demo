import logo from '../assets/Logo_2.png';
import './LoginPromptModal.css';

const LoginPromptModal = ({ isOpen, onClose, onLogin }) => {
  if (!isOpen) return null;

  return (
    <div className="login-prompt-overlay" onClick={onClose}>
      <div className="login-prompt-modal" onClick={(e) => e.stopPropagation()}>
        <button className="login-prompt-close" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div className="login-prompt-content">
          <div className="login-prompt-logo">
            <img src={logo} alt="IAT Logo" />
          </div>
          <h3 className="login-prompt-title">请先登录</h3>
          <p className="login-prompt-text">登录后即可使用此功能</p>
          <button className="login-prompt-button" onClick={onLogin}>
            去登录
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPromptModal;
