type HelperAlertProps = {
  children: React.ReactNode;
  tone?: 'info' | 'warn';
};

export function HelperAlert({ children, tone = 'info' }: HelperAlertProps) {
  return <p className={tone === 'warn' ? 'ui-helper-warn' : 'ui-helper'}>{children}</p>;
}
