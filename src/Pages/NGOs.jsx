import { useState } from "react";
import SearchBar from "../components/SearchBar";
import NGOCard from "../components/NGOCard";
import ngos from "../data/ngos";

function NGOs() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Healthcare", "Education", "Microfinance"];

  const filteredNGOs = ngos.filter((ngo) => {
    const searchMatch = ngo.name.toLowerCase().includes(search.toLowerCase());
    const categoryMatch =
      selectedCategory === "All" || ngo.category === selectedCategory;
    return searchMatch && categoryMatch;
  });

  return (
    <div className="ngos-page">
      <div className="ngos-header">
        <h1>Discover NGOs</h1>
        <p>Find and connect with organizations making a difference</p>
      </div>

      <SearchBar search={search} setSearch={setSearch} />

      <div className="category-buttons">
        {categories.map((category) => (
          <button
            key={category}
            className={selectedCategory === category ? "active" : ""}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {filteredNGOs.length === 0 ? (
        <div className="no-ngos">
          <h3>No NGOs Found</h3>
          <p>Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="ngo-container">
          {filteredNGOs.map((ngo) => (
            <NGOCard
              key={ngo.id}
              id={ngo.id}
              name={ngo.name}
              city={ngo.location}
              category={ngo.category}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default NGOs;