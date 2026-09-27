import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, MapPin, ArrowRight, Volume2, ChevronDown } from 'lucide-react';
import { schemes, states, categories } from '../data/mockData';

export default function SchemeDirectory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  const filteredSchemes = useMemo(() => {
    return schemes.filter((scheme) => {
      const matchesSearch = scheme.scheme_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scheme.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesState = selectedState === 'ALL' || scheme.state_code === selectedState || scheme.state_code === 'ALL';
      const matchesCategory = !selectedCategory || scheme.category === selectedCategory;
      return matchesSearch && matchesState && matchesCategory;
    });
  }, [searchQuery, selectedState, selectedCategory]);

  const paginatedSchemes = filteredSchemes.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredSchemes.length / itemsPerPage);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Agriculture': 'bg-green-100 text-green-700',
      'Healthcare': 'bg-red-100 text-red-700',
      'Education': 'bg-blue-100 text-blue-700',
      'Housing': 'bg-purple-100 text-purple-700',
      'Women & Child': 'bg-pink-100 text-pink-700',
      'Women': 'bg-pink-100 text-pink-700',
      'Utilities': 'bg-yellow-100 text-yellow-700',
      'Employment': 'bg-indigo-100 text-indigo-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🏛️ Government Scheme Directory</h1>
        <p className="text-gray-600">Browse and discover government schemes by state and category</p>
      </div>

      {/* Search & Filters */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search schemes by name or category..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="input-field pl-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-outline flex items-center gap-2 md:w-auto"
          >
            <Filter size={18} />
            Filters
            <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <select
                value={selectedState}
                onChange={(e) => { setSelectedState(e.target.value); setPage(1); }}
                className="input-field"
              >
                <option value="ALL">All States / Central</option>
                {states.map((state) => (
                  <option key={state.code} value={state.code}>{state.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                className="input-field"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          Showing {paginatedSchemes.length} of {filteredSchemes.length} schemes
        </p>
      </div>

      {/* Scheme Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedSchemes.map((scheme) => (
          <Link
            key={scheme.id}
            to={`/schemes/${scheme.id}`}
            className="card group hover:scale-[1.02] transition-transform duration-200"
          >
            <div className="flex items-start justify-between mb-3">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(scheme.category)}`}>
                {scheme.category}
              </span>
              <span className="text-xs text-gray-400">{scheme.level}</span>
            </div>
            
            <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-saffron transition-colors">
              {scheme.scheme_name}
            </h3>
            
            <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
              <MapPin size={14} />
              {scheme.state}
            </div>
            
            <p className="text-sm text-gray-600 line-clamp-2 mb-4">
              {scheme.benefits.substring(0, 120)}...
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">Click for details</span>
              <ArrowRight size={16} className="text-saffron group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-10 h-10 rounded-lg font-medium text-sm transition-all ${
                p === page
                  ? 'bg-saffron text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {filteredSchemes.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No schemes found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
