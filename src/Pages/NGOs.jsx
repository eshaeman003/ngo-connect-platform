import NGOCard from "../components/NGOCard";
import ngos from "../data/ngos";

function NGOs() {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "20px",
        padding: "20px",
        justifyContent: "center",
      }}
    >
      {ngos.map((ngo) => (
        <NGOCard
          key={ngo.id}
          name={ngo.name}
          city={ngo.city}
          category={ngo.category}
        />
      ))}
    </div>
  );
}

export default NGOs;