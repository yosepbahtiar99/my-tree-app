import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  ControlButton,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useDialogStore } from '../store/dialogStore';
import PersonDetailDrawer from '../components/PersonDetailDrawer';
import PersonFormModal from '../components/PersonFormModal';
import MarriageFormModal from '../components/MarriageFormModal';
import PersonNodeV2 from '../components/PersonNodeV2';
import SearchBar from '../components/SearchBar';
import { Handle, Position, BaseEdge } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';

const MarriageNode = () => (
  <div style={{ width: 4, height: 4, background: '#333', borderRadius: '50%' }}>
    <Handle type="target" position={Position.Left} id="left-target" style={{ opacity: 0 }} />
    <Handle type="target" position={Position.Right} id="right-target" style={{ opacity: 0 }} />
    <Handle type="source" position={Position.Bottom} id="bottom-source" style={{ opacity: 0 }} />
  </div>
);

const ChildEdge = ({ sourceX, sourceY, targetX, targetY, style, markerEnd, source }: EdgeProps) => {
  let hash = 0;
  for (let i = 0; i < source.length; i++) {
    hash = source.charCodeAt(i) + ((hash << 5) - hash);
  }
  const offset = 20 + (Math.abs(hash) % 60); 
  const midY = sourceY + offset;
  
  const path = `M ${sourceX},${sourceY} L ${sourceX},${midY} L ${targetX},${midY} L ${targetX},${targetY}`;
  
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];
  const strokeColor = colors[Math.abs(hash) % colors.length];

  return <BaseEdge path={path} markerEnd={markerEnd} style={{ ...style, stroke: strokeColor }} />;
};

const nodeTypes = { person: PersonNodeV2, marriage: MarriageNode };
const edgeTypes = { child: ChildEdge };

const nodeWidth = 240;
const nodeHeight = 64;

const getLayoutedElements = (nodes: any[], edges: any[], marriageMap: Map<string, any>, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 120, ranksep: 120 });

  const marriageDotWidth = 60;

  // 1. Identifikasi orang-orang dan bangun adjList (Adjacency List untuk Pasangan)
  const personNodes = nodes.filter(n => n.type === 'person');
  const adjList = new Map<string, string[]>();

  marriageMap.forEach((m) => {
    const h = m.husbandId.toString();
    const w = m.wifeId.toString();
    if (!adjList.has(h)) adjList.set(h, []);
    if (!adjList.has(w)) adjList.set(w, []);
    adjList.get(h)!.push(w);
    adjList.get(w)!.push(h);
  });

  // 2. Kumpulkan Cluster menggunakan BFS
  const visited = new Set<string>();
  const clusters: string[][] = [];

  personNodes.forEach(pn => {
    const pid = pn.id;
    if (!visited.has(pid)) {
      const comp: string[] = [];
      const q = [pid];
      visited.add(pid);
      
      while(q.length > 0) {
        const curr = q.shift()!;
        comp.push(curr);
        const neighbors = adjList.get(curr) || [];
        neighbors.forEach(n => {
          if (!visited.has(n)) {
            visited.add(n);
            q.push(n);
          }
        });
      }
      clusters.push(comp);
    }
  });

  // Helper untuk mendapatkan key marriage
  const getMarriageKey = (id1: string, id2: string) => `marriage-${[id1, id2].sort().join('-')}`;

  // 3. Flatten setiap cluster menjadi sequence kaku (Suami - TitikNikah - Istri)
  const clusterSequences = clusters.map(comp => {
    const placed = new Set<string>();
    const sequence: { id: string, type: 'person' | 'marriage' }[] = [];
    
    sequence.push({ id: comp[0], type: 'person' });
    placed.add(comp[0]);
    
    let added = true;
    while(added) {
      added = false;
      for (const p of comp) {
        if (placed.has(p)) continue;
        
        const leftMost = sequence[0];
        if (leftMost.type === 'person' && marriageMap.has(getMarriageKey(p, leftMost.id))) {
          sequence.unshift({ id: getMarriageKey(p, leftMost.id), type: 'marriage' });
          sequence.unshift({ id: p, type: 'person' });
          placed.add(p);
          added = true;
          continue;
        }
        
        const rightMost = sequence[sequence.length - 1];
        if (rightMost.type === 'person' && marriageMap.has(getMarriageKey(p, rightMost.id))) {
          sequence.push({ id: getMarriageKey(p, rightMost.id), type: 'marriage' });
          sequence.push({ id: p, type: 'person' });
          placed.add(p);
          added = true;
          continue;
        }
      }
      
      // Fallback jika punya >2 pasangan (Poligami kompleks)
      if (!added && placed.size < comp.length) {
        for (const p of comp) {
          if (!placed.has(p)) {
            const spouseInSeq = sequence.find(s => s.type === 'person' && marriageMap.has(getMarriageKey(p, s.id)));
            if (spouseInSeq) {
              sequence.push({ id: getMarriageKey(p, spouseInSeq.id), type: 'marriage' });
              sequence.push({ id: p, type: 'person' });
              placed.add(p);
              added = true;
              break;
            }
          }
        }
      }
    }
    return sequence;
  });

  // 4. Daftarkan Cluster ke Dagre sebagai 1 Node Solid
  const elementToCluster = new Map<string, string>();
  
  clusterSequences.forEach((seq, idx) => {
    const clusterId = `cluster-${idx}`;
    let clusterWidth = 0;
    seq.forEach(item => {
      clusterWidth += (item.type === 'person' ? nodeWidth : marriageDotWidth);
      elementToCluster.set(item.id, clusterId);
    });

    dagreGraph.setNode(clusterId, { width: clusterWidth, height: nodeHeight });
  });

  // 5. Daftarkan Edges (Anak) antar Cluster ke Dagre
  edges.forEach(edge => {
    if (edge.target.startsWith('marriage-') === false) { // Garis ke anak
      const parentCluster = elementToCluster.get(edge.source);
      const childCluster = elementToCluster.get(edge.target);
      if (parentCluster && childCluster && parentCluster !== childCluster) {
        dagreGraph.setEdge(parentCluster, childCluster);
      }
    }
  });

  // 6. Jalankan Layout Dagre (Hanya mengurus Blok)
  dagre.layout(dagreGraph);

  // 7. Unpacking Koordinat dari Blok Dagre ke Node Individu
  const finalNodes: any[] = [];
  
  clusterSequences.forEach((seq, idx) => {
    const clusterId = `cluster-${idx}`;
    const cNode = dagreGraph.node(clusterId);
    if (!cNode) return;
    
    let currentX = cNode.x - cNode.width / 2;
    const currentY = cNode.y;
    
    seq.forEach(item => {
      const originalNode = nodes.find(n => n.id === item.id);
      if (item.type === 'person') {
        finalNodes.push({
          ...originalNode,
          position: { x: currentX, y: currentY - nodeHeight / 2 }
        });
        currentX += nodeWidth;
      } else {
        finalNodes.push({
          ...originalNode,
          position: { x: currentX + (marriageDotWidth / 2) - 2, y: currentY - 2 } // 4x4 dot size
        });
        currentX += marriageDotWidth;
      }
    });
  });

  // 8. Update target/source handle untuk edge horizontal (suami-istri)
  const finalEdges = edges.map((edge) => {
    if (edge.target.startsWith('marriage-')) {
      const sourceNode = finalNodes.find(n => n.id === edge.source);
      const targetNode = finalNodes.find(n => n.id === edge.target);
      if (sourceNode && targetNode) {
        const isLeft = sourceNode.position.x < targetNode.position.x;
        return {
          ...edge,
          sourceHandle: isLeft ? 'right-source' : 'left-source',
          targetHandle: isLeft ? 'left-target' : 'right-target',
        };
      }
    }
    return edge;
  });

  return { nodes: finalNodes, edges: finalEdges };
};

export default function TreePage() {
  const { user } = useAuthStore();
  const { showAlert, showConfirm } = useDialogStore();
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [rawPersons, setRawPersons] = useState<any[]>([]);
  const rawMarriagesRef = useRef<any[]>([]);

  // States for Modals
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [isMarriageModalOpen, setIsMarriageModalOpen] = useState(false);
  const [personModalInitialData, setPersonModalInitialData] = useState<any>(null);
  const [personModalEditData, setPersonModalEditData] = useState<any>(null);
  const [personModalAddingParentForId, setPersonModalAddingParentForId] = useState<string | undefined>(undefined);
  const [marriageModalHusbandId, setMarriageModalHusbandId] = useState<string>('');
  const [marriageModalWifeId, setMarriageModalWifeId] = useState<string>('');
  
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [focusedPersonId, setFocusedPersonId] = useState<string | null>(null);



  useEffect(() => {
    setNodes((nds) => 
      nds.map(node => ({
        ...node,
        data: {
          ...node.data,
          isHighlighted: node.id === highlightedNodeId
        }
      }))
    );
  }, [highlightedNodeId, setNodes]);

  const handleHighlight = useCallback((id: string) => {
    setHighlightedNodeId(id);
    setTimeout(() => {
      setHighlightedNodeId(null);
    }, 3000);
  }, []);

  const handleNodeAction = useCallback(async (action: string, person: any) => {
    if (action === 'ADD_CHILD') {
      // Cari apakah person ini punya pasangan (marriage)
      let spouseId = '';
      const personMarriages = rawMarriagesRef.current.filter(m => m.husbandId === person.id || m.wifeId === person.id);
      
      // Jika hanya punya 1 pasangan, otomatis pilih pasangan tersebut sebagai orang tua
      if (personMarriages.length === 1) {
        spouseId = personMarriages[0].husbandId === person.id ? personMarriages[0].wifeId : personMarriages[0].husbandId;
      }

      setPersonModalAddingParentForId(undefined);
      setPersonModalEditData(null);
      setPersonModalInitialData({
        fatherId: person.gender === 'MALE' ? person.id : (spouseId && person.gender === 'FEMALE' ? spouseId : ''),
        motherId: person.gender === 'FEMALE' ? person.id : (spouseId && person.gender === 'MALE' ? spouseId : ''),
      });
      setIsPersonModalOpen(true);
    } else if (action === 'ADD_PARENT') {
      setPersonModalAddingParentForId(person.id);
      setPersonModalEditData(null);
      setPersonModalInitialData(null);
      setIsPersonModalOpen(true);
    } else if (action === 'ADD_SPOUSE') {
      setMarriageModalHusbandId(person.gender === 'MALE' ? person.id : '');
      setMarriageModalWifeId(person.gender === 'FEMALE' ? person.id : '');
      setIsMarriageModalOpen(true);
    } else if (action === 'EDIT_PROFILE' || action === 'EDIT') {
      setPersonModalAddingParentForId(undefined);
      setPersonModalEditData(person);
      setPersonModalInitialData(null);
      setIsPersonModalOpen(true);
    } else if (action === 'DELETE') {
      const confirmed = await showConfirm({
        title: 'Hapus Anggota Keluarga?',
        message: 'Yakin ingin menghapus anggota ini? Data yang dihapus tidak bisa dikembalikan.',
        type: 'danger',
        confirmText: 'Hapus'
      });
      if (confirmed) {
        try {
          await api.delete(`/persons/${person.id}`);
          fetchTree();
        } catch (error: any) {
          showAlert({ title: 'Gagal', message: error.response?.data?.message || 'Gagal menghapus person', type: 'error' });
        }
      }
    } else if (action === 'FOCUS_FAMILY') {
      setFocusedPersonId(person.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawMarriagesRef, showConfirm, showAlert]);

  const handleDrawerAction = useCallback((action: string, personPayload: any) => {
    if (action === 'VIEW_PERSON') {
      setSelectedPerson(personPayload);
    } else {
      setSelectedPerson(null);
      handleNodeAction(action, personPayload);
    }
  }, [handleNodeAction]);

  const fetchTree = useCallback(async () => {
    try {
      const res = await api.get('/persons/tree');
      let { persons, marriages } = res.data;

      if (focusedPersonId) {
        const visibleIds = new Set<string>();
        const q = [focusedPersonId];
        visibleIds.add(focusedPersonId);

        while (q.length > 0) {
          const curr = q.shift()!;
          
          marriages.forEach((m: any) => {
            if (m.husbandId === curr && !visibleIds.has(m.wifeId)) {
              visibleIds.add(m.wifeId);
              q.push(m.wifeId);
            }
            if (m.wifeId === curr && !visibleIds.has(m.husbandId)) {
              visibleIds.add(m.husbandId);
              q.push(m.husbandId);
            }
          });

          persons.forEach((p: any) => {
            if ((p.fatherId === curr || p.motherId === curr) && !visibleIds.has(p.id)) {
              visibleIds.add(p.id);
              q.push(p.id);
            }
          });
        }
        
        persons = persons.filter((p: any) => visibleIds.has(p.id));
        marriages = marriages.filter((m: any) => visibleIds.has(m.husbandId) && visibleIds.has(m.wifeId));
      }

      // Urutkan berdasarkan tanggal lahir (yang tertua di kiri/awal)
      const sortedPersons = [...persons].sort((a, b) => {
        if (!a.birthDate) return 1;
        if (!b.birthDate) return -1;
        return new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime();
      });

      // Kumpulkan data pernikahan resmi dan tersirat
      const marriageMap = new Map<string, any>(); 
      const getMarriageKey = (hId: string, wId: string) => `marriage-${[hId, wId].sort().join('-')}`;

      if (marriages && marriages.length > 0) {
        marriages.forEach((m: any) => {
          if (m.husbandId && m.wifeId) {
            const key = getMarriageKey(m.husbandId, m.wifeId);
            marriageMap.set(key, { husbandId: m.husbandId, wifeId: m.wifeId });
          }
        });
      }

      sortedPersons.forEach((person: any) => {
        if (person.fatherId && person.motherId) {
          const key = getMarriageKey(person.fatherId, person.motherId);
          if (!marriageMap.has(key)) {
            marriageMap.set(key, { husbandId: person.fatherId, wifeId: person.motherId });
          }
        }
      });

      // OPSI 1: Spouse Grouping (Kelompokkan Pasangan Berurutan)
      const groupedPersons: any[] = [];
      const visited = new Set();
      
      sortedPersons.forEach(p => {
        if (visited.has(p.id)) return;
        groupedPersons.push(p);
        visited.add(p.id);

        // Cari semua pasangan dari orang ini via marriageMap
        const spouseIds: string[] = [];
        marriageMap.forEach(m => {
          if (m.husbandId === p.id) spouseIds.push(m.wifeId);
          if (m.wifeId === p.id) spouseIds.push(m.husbandId);
        });
          
        spouseIds.forEach((sId: string) => {
          if (!visited.has(sId)) {
            const spouse = sortedPersons.find(sp => sp.id === sId);
            if (spouse) {
              groupedPersons.push(spouse);
              visited.add(sId);
            }
          }
        });
      });

      setRawPersons(groupedPersons);
      rawMarriagesRef.current = marriages || [];

      const initialNodes: any[] = groupedPersons.map((p: any) => ({
        id: p.id.toString(),
        type: 'person',
        position: { x: 0, y: 0 },
        data: {
          ...p,
          user,
          onAction: handleDrawerAction,
        },
      }));

      const initialEdges: any[] = [];

      // 3. Buat Titik Nikah Transparan & Hubungkan Ayah/Ibu ke Titik Nikah
      marriageMap.forEach((m, key) => {
        initialNodes.push({
          id: key,
          type: 'marriage',
          position: { x: 0, y: 0 },
          data: { label: '' },
        });

        // Garis Ayah ke Titik Nikah
        initialEdges.push({
          id: `e${m.husbandId}-${key}`,
          source: m.husbandId.toString(),
          target: key,
          type: 'straight',
          animated: false,
          style: { stroke: '#f43f5e', strokeWidth: 2, strokeDasharray: '5,5' } // Rose-500, dashed
        });

        // Garis Ibu ke Titik Nikah
        initialEdges.push({
          id: `e${m.wifeId}-${key}`,
          source: m.wifeId.toString(),
          target: key,
          type: 'straight',
          animated: false,
          style: { stroke: '#f43f5e', strokeWidth: 2, strokeDasharray: '5,5' } // Rose-500, dashed
        });
      });

      // 4. Hubungkan Anak ke Titik Nikah atau ke Orangtua Tunggal
      sortedPersons.forEach((person: any) => {
        if (person.fatherId && person.motherId) {
          const key = getMarriageKey(person.fatherId, person.motherId);
          initialEdges.push({
            id: `e${key}-${person.id}`,
            source: key,
            target: person.id.toString(),
            sourceHandle: 'bottom-source',
            targetHandle: 'top',
            type: 'child',
            animated: false,
            style: { strokeWidth: 2 }
          });
        } else if (person.fatherId) {
          initialEdges.push({
            id: `e${person.fatherId}-${person.id}`,
            source: person.fatherId.toString(),
            target: person.id.toString(),
            sourceHandle: 'bottom',
            targetHandle: 'top',
            type: 'child',
            animated: false,
            style: { strokeWidth: 2 }
          });
        } else if (person.motherId) {
          initialEdges.push({
            id: `e${person.motherId}-${person.id}`,
            source: person.motherId.toString(),
            target: person.id.toString(),
            sourceHandle: 'bottom',
            targetHandle: 'top',
            type: 'child',
            animated: false,
            style: { strokeWidth: 2 }
          });
        }
      });

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        initialNodes,
        initialEdges,
        marriageMap
      );

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    } catch (error) {
      console.error('Failed to fetch tree data', error);
    } finally {
      setLoading(false);
    }
  }, [setNodes, setEdges, user, handleNodeAction, focusedPersonId]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  if (loading) return <div className="p-10 text-center">Memuat Silsilah...</div>;

  const handleNodeClick = (_: React.MouseEvent, node: any) => {
    if (node.type === 'person') {
      const personData = rawPersons.find(p => p.id.toString() === node.id);
      if (personData) {
        setSelectedPerson(personData);
      }
    }
  };

  return (
    <div className="w-full h-[calc(100vh-64px)]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodesDraggable={false}
        elementsSelectable={false}
        fitView
      >
        <Controls>
          {focusedPersonId && (
            <ControlButton onClick={() => setFocusedPersonId(null)} title="Batal Fokus" style={{ color: '#ef4444', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: '20px', height: '20px' }}>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </ControlButton>
          )}
          <ControlButton onClick={fetchTree} title="Refresh Silsilah" style={{ minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: '20px', height: '20px' }}>
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </ControlButton>
        </Controls>
        <MiniMap />
        {/* <Background gap={12} size={1} /> */}
        <SearchBar persons={rawPersons} onHighlight={handleHighlight} />
      </ReactFlow>
      
      <PersonDetailDrawer 
        isOpen={!!selectedPerson} 
        onClose={() => setSelectedPerson(null)} 
        person={selectedPerson} 
        allPersons={rawPersons}
        allMarriages={rawMarriagesRef.current}
        onAction={handleDrawerAction}
        isAdmin={!!user}
      />

      {/* Modals for Context Menu Actions */}
      <PersonFormModal 
        isOpen={isPersonModalOpen}
        onClose={() => setIsPersonModalOpen(false)}
        onSuccess={fetchTree}
        persons={rawPersons}
        editData={personModalEditData}
        initialData={personModalInitialData}
        addingParentForId={personModalAddingParentForId}
      />

      <MarriageFormModal
        isOpen={isMarriageModalOpen}
        onClose={() => setIsMarriageModalOpen(false)}
        onSuccess={fetchTree}
        persons={rawPersons}
        initialHusbandId={marriageModalHusbandId}
        initialWifeId={marriageModalWifeId}
      />
    </div>
  );
}
