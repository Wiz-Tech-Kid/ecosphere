interface HeaderProps {
  title: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="text-center mb-6">
      <h1 className="text-3xl font-bold">{title}</h1>
      {subtitle && <p className="text-gray-600">{subtitle}</p>}
    </div>
  );
};

export default Header;
