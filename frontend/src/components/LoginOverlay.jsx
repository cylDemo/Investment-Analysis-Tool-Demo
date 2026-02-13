import logo from '../assets/Logo_2.png';
import './LoginOverlay.css';

const LoginOverlay = ({ isVisible, onLogin }) => {
  if (!isVisible) return null;

  return (
    <div className="login-overlay">
      <div className="login-overlay-content">
        <div className="login-overlay-logo">
          <img src={logo} alt="IAT Logo" />
        </div>
        <h3 className="login-overlay-title">请先登录后查看</h3>
        <button className="login-overlay-button" onClick={onLogin}>
          去登录
        </button>
      </div>
    </div>
  );
};

export default LoginOverlay;
