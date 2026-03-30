export default function WelcomeCard({ username }) {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold">
        Welcome{username ? `, ${username}` : ""}!
      </h2>
    </div>
  );
}