import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { KetcherModal } from '../../components/ui/KetcherModal';
import { getRDKit } from '../../utils/rdkit';
import { identifyStructure } from '../../utils/chemApi'; // fetchStructureByCas 제거됨

// Internal Component: Modal for selecting a CAS number from a list
const CasSelectModal = ({ isOpen, candidates, onSelect, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
        <div className="bg-brand-50 p-4 border-b border-brand-100 flex justify-between items-center">
          <h3 className="text-brand-700 font-bold flex items-center gap-2">
            <Icon name="list" size={18} /> Select CAS No.
          </h3>
          <button onClick={onClose} className="text-brand-400 hover:text-brand-700">
            <Icon name="x" size={20} />
          </button>
        </div>
        <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <p className="text-xs text-slate-500 mb-3">
            Multiple CAS numbers found. Please select the correct one:
          </p>
          <div className="space-y-2">
            {candidates.map((cas) => (
              <button
                key={cas}
                onClick={() => onSelect(cas)}
                className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:border-brand-500 hover:bg-brand-50 transition flex justify-between items-center group"
              >
                <span className="font-mono font-bold text-slate-700">{cas}</span>
                <Icon
                  name="check-circle"
                  className="text-brand-500 opacity-0 group-hover:opacity-100 transition"
                  size={16}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const MasterStockTab = ({
  globalInventory = [],
  updateGlobalInventory,
  readOnly,
}) => {
  // --- State: Search & Pagination ---
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // --- State: Structure Search ---
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [matchedIds, setMatchedIds] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // --- State: Edit/Add Item ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [targetItemId, setTargetItemId] = useState(null);

  // --- State: CAS Selection (from Structure) ---
  const [casSelectData, setCasSelectData] = useState({
    isOpen: false,
    candidates: [],
    pendingInfo: null, // Stores data waiting for user selection
  });

  // =========================
  // Helper Functions
  // =========================
  const normalizeSmiles = async (smiles) => {
    if (!smiles) return '';
    try {
      const rdkit = await getRDKit();
      const mol = rdkit.get_mol(smiles);
      if (!mol) return '';
      const canon = mol.get_smiles();
      mol.delete();
      return canon || '';
    } catch (e) {
      return '';
    }
  };

  const parseMatchAtoms = (matchJson) => {
    if (!matchJson || matchJson === '{}' || matchJson === '""') return null;
    try {
      const parsed = JSON.parse(matchJson);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.atoms)) return parsed.atoms;
      if (parsed && typeof parsed === 'object') {
        const vals = Object.values(parsed);
        if (vals.every((v) => Number.isInteger(v))) return vals;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  // =========================
  // CRUD Operations
  // =========================
  const addNewItem = () => {
    if (readOnly) return;
    const newItem = {
      id: Date.now(),
      name: 'New Material',
      casNo: '',
      purity: '',
      unit: 'g',
      currentStock: 0,
      location: '',
      maker: '',
      description: '',
      structureSmiles: '',
      structureMol: '',
      structureSvg: '',
      hasStructure: false,
    };
    updateGlobalInventory([newItem, ...globalInventory]);
    setCurrentPage(1);
  };

  const updateItem = (id, key, value) => {
    if (readOnly) return;
    const updated = globalInventory.map((item) =>
      item.id === id ? { ...item, [key]: value } : item
    );
    updateGlobalInventory(updated);
  };

  const deleteItem = (id) => {
    if (readOnly) return;
    if (window.confirm('Delete this item?')) {
      updateGlobalInventory(globalInventory.filter((item) => item.id !== id));
    }
  };

  const openStructureEditor = (id) => {
    if (readOnly) return;
    setTargetItemId(id);
    setIsEditModalOpen(true);
  };

  // =========================
  // Structure Save & CAS Selection Logic
  // =========================
  const handleStructureSave = async (smiles, molfile, svg, identifiedInfo) => {
    if (!targetItemId) return;

    const canon = await normalizeSmiles(smiles);
    const finalSmiles = canon || smiles || '';

    // Prepare data object to update
    const baseData = {
      structureSmiles: finalSmiles,
      structureMol: molfile,
      structureSvg: svg,
      hasStructure: !!finalSmiles,
      identifiedInfo: identifiedInfo,
    };

    // Check if multiple CAS candidates exist (Found from Structure)
    if (
      identifiedInfo &&
      identifiedInfo.casCandidates &&
      identifiedInfo.casCandidates.length > 1
    ) {
      // Trigger selection modal
      setCasSelectData({
        isOpen: true,
        candidates: identifiedInfo.casCandidates,
        pendingInfo: baseData,
      });
      setIsEditModalOpen(false); // Close editor
    } else {
      // Single or no candidate, update immediately
      applyUpdate(baseData);
      setIsEditModalOpen(false);
    }
  };

  const applyUpdate = (data, selectedCas = null) => {
    if (!targetItemId) return;

    const {
      structureSmiles,
      structureMol,
      structureSvg,
      hasStructure,
      identifiedInfo,
    } = data;

    const updated = globalInventory.map((item) => {
      if (item.id === targetItemId) {
        const newItem = {
          ...item,
          structureSmiles,
          structureMol,
          structureSvg,
          hasStructure,
        };

        if (identifiedInfo) {
          // Auto-fill Name if empty or default
          if (!item.name || item.name === 'New Material') {
            newItem.name = identifiedInfo.name;
          }

          // Use selected CAS if available, otherwise default to auto-identified one
          const finalCas = selectedCas || identifiedInfo.casNo;
          if (!item.casNo && finalCas) {
            newItem.casNo = finalCas;
          }

          if (!item.description) {
            newItem.description = identifiedInfo.description;
          }
        }
        return newItem;
      }
      return item;
    });

    updateGlobalInventory(updated);
  };

  const handleCasSelected = (selectedCas) => {
    if (casSelectData.pendingInfo) {
      applyUpdate(casSelectData.pendingInfo, selectedCas);
    }
    setCasSelectData({ isOpen: false, candidates: [], pendingInfo: null });
  };

  // =========================
  // Search Logic
  // =========================
  const runStructureSearch = async (querySmiles) => {
    if (!querySmiles) {
      setMatchedIds(null);
      setIsSearchModalOpen(false);
      return;
    }
    setIsSearching(true);
    setIsSearchModalOpen(false);

    try {
      const rdkit = await getRDKit();
      let queryMol = null;
      try {
        queryMol = rdkit.get_mol(querySmiles);
      } catch {
        alert('Invalid structure');
        return;
      }
      if (!queryMol) {
        alert('Invalid Structure Query');
        return;
      }

      let queryCanon = '';
      try {
        queryCanon = queryMol.get_smiles() || '';
      } catch {}

      const matches = [];
      for (const item of globalInventory) {
        if (!item.structureSmiles) continue;
        let targetMol = null;
        try {
          targetMol = rdkit.get_mol(item.structureSmiles);
          if (!targetMol) continue;

          let targetCanon = '';
          try {
            targetCanon = targetMol.get_smiles() || '';
          } catch {}

          if (queryCanon && targetCanon && queryCanon === targetCanon) {
            matches.push(item.id);
            continue;
          }

          if (typeof targetMol.has_substruct_match === 'function') {
            if (targetMol.has_substruct_match(queryMol)) matches.push(item.id);
            continue;
          }

          const matchJson = targetMol.get_substruct_match(queryMol);
          const atoms = parseMatchAtoms(matchJson);
          if (atoms && atoms.length > 0) matches.push(item.id);
        } catch {} finally {
          if (targetMol) targetMol.delete();
        }
      }
      queryMol.delete();

      if (matches.length === 0) alert('No matching structures found.');
      setMatchedIds(matches);
      setCurrentPage(1);
    } catch {
      alert('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const clearStructureSearch = () => {
    setMatchedIds(null);
    setCurrentPage(1);
  };

  const currentStructure =
    globalInventory.find((item) => item.id === targetItemId)?.structureSmiles || '';

  // =========================
  // Filter & Pagination
  // =========================
  const filteredInventory = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return globalInventory.filter((item) => {
      const name = item.name || '';
      const cas = item.casNo || '';
      const matchText =
        name.toLowerCase().includes(term) || (cas || '').includes(searchTerm);
      const matchStructure = matchedIds === null || matchedIds.includes(item.id);
      return matchText && matchStructure;
    });
  }, [globalInventory, matchedIds, searchTerm]);

  const totalPages = Math.ceil(filteredInventory.length / ITEMS_PER_PAGE);
  const currentData = useMemo(
    () =>
      filteredInventory.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
      ),
    [filteredInventory, currentPage]
  );

  const handlePageChange = (n) => {
    if (n >= 1 && n <= (totalPages || 1)) {
      setCurrentPage(n);
      document.querySelector('.custom-scrollbar')?.scrollTo(0, 0);
    }
  };

  // =========================
  // Render
  // =========================
  return (
    <div className="flex h-full bg-slate-50 flex-col p-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-brand-50 p-2 rounded-lg text-brand-600">
            <Icon name="database" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Master Stock List</h2>
            <p className="text-xs text-slate-500 font-medium">
              Global Inventory Management
            </p>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          {matchedIds !== null && (
            <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg border border-purple-100 text-xs font-bold animate-in fade-in">
              <Icon name="flask-conical" size={14} />
              Structure Filter Active ({filteredInventory.length})
              <button
                onClick={clearStructureSearch}
                className="hover:bg-purple-200 p-1 rounded-full transition ml-1"
              >
                <Icon name="x" size={12} />
              </button>
            </div>
          )}

          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-sm focus-within:ring-2 focus-within:ring-brand-100 transition">
            <div className="relative">
              <Icon
                name="search"
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Name or CAS..."
                className="pl-9 pr-2 py-1.5 bg-transparent text-sm outline-none w-48 text-slate-700 font-medium placeholder:font-normal"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="w-px h-4 bg-slate-300 mx-1"></div>

            <button
              onClick={() => setIsSearchModalOpen(true)}
              className={`p-1.5 rounded-md transition flex items-center gap-1 text-xs font-bold ${
                matchedIds !== null
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-500 hover:bg-white hover:text-brand-600'
              }`}
              title="Search by Chemical Structure"
            >
              {isSearching ? (
                <Icon name="loader" className="animate-spin" size={16} />
              ) : (
                <Icon name="hexagon" size={16} />
              )}
            </button>
          </div>

          {!readOnly && (
            <button
              onClick={addNewItem}
              className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md transition"
            >
              <Icon name="plus" size={16} /> Add Item
            </button>
          )}
        </div>
      </div>

      {/* Grid Table */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-auto custom-scrollbar flex-1">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-3 w-24 text-center">Structure</th>
                <th className="p-3 w-12 text-center">No.</th>
                <th className="p-3">Material Name</th>
                <th className="p-3 w-32">CAS No.</th>
                <th className="p-3 w-20">Purity</th>
                <th className="p-3 w-36">Total Stock</th>
                <th className="p-3 w-24">Maker</th>
                <th className="p-3 w-24">Location</th>
                <th className="p-3">Note</th>
                {!readOnly && <th className="p-3 w-10 text-center"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentData.length > 0 ? (
                currentData.map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 transition group"
                  >
                    <td className="p-2 align-middle">
                      <div
                        onClick={() => openStructureEditor(item.id)}
                        className={`w-20 h-16 mx-auto rounded-lg border flex items-center justify-center cursor-pointer overflow-hidden bg-white relative ${
                          item.hasStructure
                            ? 'border-brand-200 shadow-sm'
                            : 'border-slate-200 border-dashed hover:border-slate-400'
                        }`}
                        title={
                          item.hasStructure ? 'Edit Structure' : 'Add Structure'
                        }
                      >
                        {item.structureSvg ? (
                          <div
                            className="w-full h-full p-1 flex items-center justify-center [&_svg]:w-full [&_svg]:h-full [&_svg]:max-w-full [&_svg]:max-h-full"
                            dangerouslySetInnerHTML={{
                              __html: item.structureSvg,
                            }}
                          />
                        ) : (
                          <Icon
                            name="hexagon"
                            size={20}
                            className={
                              item.hasStructure
                                ? 'text-brand-500'
                                : 'text-slate-300'
                            }
                          />
                        )}
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition pointer-events-none">
                          <Icon
                            name="edit-2"
                            size={16}
                            className="text-slate-700"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center text-slate-400 font-mono text-xs">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>
                    <td className="p-3">
                      <input
                        disabled={readOnly}
                        className="w-full bg-transparent font-bold text-slate-700 outline-none focus:text-brand-600 focus:border-b focus:border-brand-500 transition px-1 py-0.5"
                        value={item.name}
                        onChange={(e) =>
                          updateItem(item.id, 'name', e.target.value)
                        }
                        placeholder="Material Name"
                      />
                    </td>
                    <td className="p-3">
                      {/* CAS Input (버튼 삭제됨) */}
                      <input
                        disabled={readOnly}
                        className="w-full bg-transparent font-mono text-xs text-slate-500 outline-none focus:text-slate-700 focus:border-b focus:border-brand-500 transition px-1 py-0.5"
                        value={item.casNo}
                        onChange={(e) =>
                          updateItem(item.id, 'casNo', e.target.value)
                        }
                        placeholder="00-00-0"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <input
                          disabled={readOnly}
                          className="w-full bg-transparent text-right outline-none font-bold text-slate-600"
                          value={item.purity}
                          onChange={(e) =>
                            updateItem(item.id, 'purity', e.target.value)
                          }
                          placeholder="99.9"
                        />
                        <span className="text-slate-400">%</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 bg-slate-50 rounded px-2 py-1 border border-slate-200 w-full">
                        <input
                          disabled={readOnly}
                          type="number"
                          className="w-full bg-transparent text-right outline-none font-bold text-slate-700"
                          value={item.currentStock}
                          onChange={(e) =>
                            updateItem(item.id, 'currentStock', e.target.value)
                          }
                          placeholder="0"
                        />
                        <input
                          disabled={readOnly}
                          className="w-10 bg-transparent text-xs text-center text-slate-500 outline-none font-bold"
                          value={item.unit}
                          onChange={(e) =>
                            updateItem(item.id, 'unit', e.target.value)
                          }
                          placeholder="g"
                        />
                      </div>
                    </td>
                    <td className="p-3">
                      <input
                        disabled={readOnly}
                        className="w-full bg-transparent outline-none text-slate-600 focus:border-b focus:border-brand-500 px-1"
                        value={item.maker}
                        onChange={(e) =>
                          updateItem(item.id, 'maker', e.target.value)
                        }
                        placeholder="-"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        disabled={readOnly}
                        className="w-full bg-transparent outline-none text-slate-600 focus:border-b focus:border-brand-500 px-1"
                        value={item.location}
                        onChange={(e) =>
                          updateItem(item.id, 'location', e.target.value)
                        }
                        placeholder="-"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        disabled={readOnly}
                        className="w-full bg-transparent outline-none text-slate-500 focus:border-b focus:border-brand-500 px-1"
                        value={item.description}
                        onChange={(e) =>
                          updateItem(item.id, 'description', e.target.value)
                        }
                        placeholder="Memo"
                      />
                    </td>
                    {!readOnly && (
                      <td className="p-3 text-center">
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="text-slate-300 hover:text-rose-500 transition"
                        >
                          <Icon name="trash-2" size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={10}
                    className="p-12 text-center text-slate-400"
                  >
                    No items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 font-medium">
          <div>
            Showing{' '}
            <span className="font-bold text-slate-800">
              {currentData.length > 0
                ? (currentPage - 1) * ITEMS_PER_PAGE + 1
                : 0}
            </span>{' '}
            to{' '}
            <span className="font-bold text-slate-800">
              {Math.min(
                currentPage * ITEMS_PER_PAGE,
                filteredInventory.length
              )}
            </span>{' '}
            of{' '}
            <span className="font-bold text-slate-800">
              {filteredInventory.length}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <span className="flex items-center px-2 font-bold text-slate-700">
              Page {currentPage} / {totalPages || 1}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CasSelectModal
        isOpen={casSelectData.isOpen}
        candidates={casSelectData.candidates}
        onSelect={handleCasSelected}
        onClose={() =>
          setCasSelectData({
            isOpen: false,
            candidates: [],
            pendingInfo: null,
          })
        }
      />

      {isEditModalOpen && (
        <KetcherModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleStructureSave}
          initialSmiles={currentStructure}
        />
      )}

      {isSearchModalOpen && (
        <KetcherModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
          onSave={(smiles) => runStructureSearch(smiles)}
          initialSmiles=""
        />
      )}
    </div>
  );
};