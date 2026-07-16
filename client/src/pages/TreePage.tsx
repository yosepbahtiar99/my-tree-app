import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  ControlButton,
  Background,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import PersonDetailModal from '../components/PersonDetailModal';
import PersonFormModal from '../components/PersonFormModal';
import MarriageFormModal from '../components/MarriageFormModal';
import PersonNode from '../components/PersonNode';
import SearchBar from '../components/SearchBar';
import { Handle, Position } from '@xyflow/react';

const MarriageNode = () => (
  <div style={{ width: 4, height: 4, background: '#333', borderRadius: '50%' }}>
    <Handle type="target" position={Position.Left} id="left-target" style={{ opacity: 0 }} />
    <Handle type="target" position={Position.Right} id="right-target" style={{ opacity: 0 }} />
    <Handle type="source" position={Position.Bottom} id="bottom-source" style={{ opacity: 0 }} />
  </div>
);

const nodeTypes = { person: PersonNode, marriage: MarriageNode };

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 200;
const nodeHeight = 150;

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    const isMarriage = node.id.startsWith('marriage-');
    dagreGraph.setNode(node.id, { 
      width: isMarriage ? 1 : nodeWidth, 
      height: isMarriage ? 1 : nodeHeight 
    });
  });

  edges.forEach((edge) => {
    // Beri bobot besar (100) untuk garis yang menuju ke titik nikah
    // agar Dagre menempatkan suami, istri, dan titik nikah sedekat mungkin (bersebelahan)
    const isMarriageEdge = edge.target.startsWith('marriage-');
    dagreGraph.setEdge(edge.source, edge.target, { 
      weight: isMarriageEdge ? 100 : 1,
      minlen: isMarriageEdge ? 0 : 1
    });
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    let nx = dagreGraph.node(node.id).x;
    let ny = dagreGraph.node(node.id).y;

    if (node.id.startsWith('marriage-')) {
      const parents = edges.filter(e => e.target === node.id).map(e => dagreGraph.node(e.source));
      if (parents.length === 2) {
        nx = (parents[0].x + parents[1].x) / 2;
        ny = (parents[0].y + parents[1].y) / 2;
      }
    }

    return {
      ...node,
      position: {
        x: nx - (node.id.startsWith('marriage-') ? 1 : nodeWidth) / 2,
        y: ny - (node.id.startsWith('marriage-') ? 1 : nodeHeight) / 2,
      },
    };
  });

  const newEdges = edges.map((edge) => {
    if (edge.target.startsWith('marriage-')) {
      const sourceNode = dagreGraph.node(edge.source);
      const targetNode = dagreGraph.node(edge.target);
      if (sourceNode && targetNode) {
        const isLeft = sourceNode.x < targetNode.x;
        return {
          ...edge,
          sourceHandle: isLeft ? 'right-source' : 'left-source',
          targetHandle: isLeft ? 'left-target' : 'right-target',
          type: 'straight'
        };
      }
    }
    return edge;
  });

  return { nodes: newNodes, edges: newEdges };
};

export default function TreePage() {
  const { user } = useAuthStore();
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

  const handleNodeAction = useCallback((action: string, person: any) => {
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
    } else if (action === 'EDIT_PROFILE') {
      setPersonModalAddingParentForId(undefined);
      setPersonModalEditData(person);
      setPersonModalInitialData(null);
      setIsPersonModalOpen(true);
    }
  }, []);

  const fetchTree = useCallback(async () => {
    try {
      const res = await api.get('/persons/tree');
      const { persons, marriages } = res.data;

      // Urutkan berdasarkan tanggal lahir (yang tertua di kiri/awal)
      const sortedPersons = [...persons].sort((a, b) => {
        if (!a.birthDate) return 1;
        if (!b.birthDate) return -1;
        return new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime();
      });

      setRawPersons(sortedPersons);
      rawMarriagesRef.current = marriages || [];

      const initialNodes: any[] = sortedPersons.map((p: any) => ({
        id: p.id.toString(),
        type: 'person',
        position: { x: 0, y: 0 },
        data: {
          ...p,
          user, // Lewatkan data user ke node
          onAction: handleNodeAction,
        },
      }));

      const initialEdges: any[] = [];
      const marriageMap = new Map<string, any>(); 

      const getMarriageKey = (hId: string, wId: string) => `marriage-${[hId, wId].sort().join('-')}`;

      // 1. Tambahkan Pernikahan Resmi dari Database
      if (marriages && marriages.length > 0) {
        marriages.forEach((m: any) => {
          if (m.husbandId && m.wifeId) {
            const key = getMarriageKey(m.husbandId, m.wifeId);
            marriageMap.set(key, { husbandId: m.husbandId, wifeId: m.wifeId });
          }
        });
      }

      // 2. Tambahkan Pernikahan "Tersirat" dari data Anak (jika belum ada)
      sortedPersons.forEach((person: any) => {
        if (person.fatherId && person.motherId) {
          const key = getMarriageKey(person.fatherId, person.motherId);
          if (!marriageMap.has(key)) {
            marriageMap.set(key, { husbandId: person.fatherId, wifeId: person.motherId });
          }
        }
      });

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
          style: { stroke: '#94a3b8', strokeWidth: 2 }
        });

        // Garis Ibu ke Titik Nikah
        initialEdges.push({
          id: `e${m.wifeId}-${key}`,
          source: m.wifeId.toString(),
          target: key,
          type: 'straight',
          animated: false,
          style: { stroke: '#94a3b8', strokeWidth: 2 }
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
            type: 'step',
            animated: false,
            style: { stroke: '#94a3b8', strokeWidth: 2 }
          });
        } else if (person.fatherId) {
          initialEdges.push({
            id: `e${person.fatherId}-${person.id}`,
            source: person.fatherId.toString(),
            target: person.id.toString(),
            sourceHandle: 'bottom',
            targetHandle: 'top',
            type: 'step',
            animated: false,
            style: { stroke: '#94a3b8', strokeWidth: 2 }
          });
        } else if (person.motherId) {
          initialEdges.push({
            id: `e${person.motherId}-${person.id}`,
            source: person.motherId.toString(),
            target: person.id.toString(),
            sourceHandle: 'bottom',
            targetHandle: 'top',
            type: 'step',
            animated: false,
            style: { stroke: '#94a3b8', strokeWidth: 2 }
          });
        }
      });

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        initialNodes,
        initialEdges
      );

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    } catch (error) {
      console.error('Failed to fetch tree data', error);
    } finally {
      setLoading(false);
    }
  }, [setNodes, setEdges, user, handleNodeAction]);

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
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
      >
        <Controls>
          <ControlButton onClick={fetchTree} title="Refresh Silsilah">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: '16px', height: '16px', margin: '0 auto' }}>
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </ControlButton>
        </Controls>
        <MiniMap />
        <Background gap={12} size={1} />
        <SearchBar persons={rawPersons} onHighlight={handleHighlight} />
      </ReactFlow>
      
      <PersonDetailModal 
        isOpen={!!selectedPerson} 
        onClose={() => setSelectedPerson(null)} 
        person={selectedPerson} 
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
