import { useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { api } from '../lib/api';
import PersonDetailModal from '../components/PersonDetailModal';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 180;
const nodeHeight = 60;

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    const isMarriage = node.id.startsWith('marriage-');
    dagreGraph.setNode(node.id, { 
      width: isMarriage ? 10 : nodeWidth, 
      height: isMarriage ? 10 : nodeHeight 
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };

    return newNode;
  });

  return { nodes: newNodes, edges };
};

export default function TreePage() {
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [rawPersons, setRawPersons] = useState<any[]>([]);

  const fetchTree = useCallback(async () => {
    try {
      const res = await api.get('/persons/tree');
      const data = res.data;

      // Urutkan berdasarkan tanggal lahir (yang tertua di kiri/awal)
      const sortedData = [...data].sort((a, b) => {
        if (!a.birthDate) return 1;
        if (!b.birthDate) return -1;
        return new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime();
      });

      setRawPersons(sortedData);

      const initialNodes: any[] = sortedData.map((person: any) => ({
        id: person.id.toString(),
        position: { x: 0, y: 0 },
        data: {
          label: (
            <div className="flex flex-col items-center justify-center p-2 bg-white rounded-lg border border-border/50 shadow-sm w-[160px]">
              {person.photoId && (
                <img 
                  src={`${import.meta.env.VITE_API_URL.replace('/api', '')}/uploads/${person.photoId}`} 
                  alt={person.fullName}
                  className="w-10 h-10 rounded-full object-cover mb-2 border border-border"
                />
              )}
              <div className="font-medium text-foreground text-center text-sm truncate w-full">{person.fullName}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Usia: {person.age !== null && person.age !== undefined ? `${person.age} Tahun` : '?'}
                {person.isDeceased && ' (Almarhum)'}
              </div>
            </div>
          )
        },
        style: { width: 160, padding: 0, border: 'none', background: 'transparent' },
      }));

      const initialEdges: any[] = [];
      const marriagePairs = new Set<string>();

      sortedData.forEach((person: any) => {
        if (person.fatherId && person.motherId) {
          const pairKey = `marriage-${person.fatherId}-${person.motherId}`;
          
          if (!marriagePairs.has(pairKey)) {
            marriagePairs.add(pairKey);
            
            // Tambahkan Titik Nikah (Dummy Node)
            initialNodes.push({
              id: pairKey,
              position: { x: 0, y: 0 },
              data: { label: '' },
              style: { width: 10, height: 10, background: '#475569', border: 'none', borderRadius: '50%', padding: 0, minWidth: 10 },
            });
            
            // Garis Ayah ke Titik Nikah
            initialEdges.push({
              id: `e${person.fatherId}-${pairKey}`,
              source: person.fatherId.toString(),
              target: pairKey,
              type: 'straight',
              animated: false,
              style: { stroke: '#475569', strokeWidth: 2 }
            });
            
            // Garis Ibu ke Titik Nikah
            initialEdges.push({
              id: `e${person.motherId}-${pairKey}`,
              source: person.motherId.toString(),
              target: pairKey,
              type: 'straight',
              animated: false,
              style: { stroke: '#475569', strokeWidth: 2 }
            });
          }

          // Garis dari Titik Nikah ke Anak
          initialEdges.push({
            id: `e${pairKey}-${person.id}`,
            source: pairKey,
            target: person.id.toString(),
            type: 'smoothstep',
            animated: false,
            style: { stroke: '#475569', strokeWidth: 2 }
          });
          
        } else if (person.fatherId) {
          // Hanya ada Ayah
          initialEdges.push({
            id: `e${person.fatherId}-${person.id}`,
            source: person.fatherId.toString(),
            target: person.id.toString(),
            type: 'smoothstep',
            animated: false,
            style: { stroke: '#92400e', strokeWidth: 2 }
          });
        } else if (person.motherId) {
          // Hanya ada Ibu
          initialEdges.push({
            id: `e${person.motherId}-${person.id}`,
            source: person.motherId.toString(),
            target: person.id.toString(),
            type: 'smoothstep',
            animated: false,
            style: { stroke: '#f59e0b', strokeWidth: 2 }
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
  }, [setNodes, setEdges]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  if (loading) return <div className="p-10 text-center">Memuat Silsilah...</div>;

  const handleNodeClick = (_: React.MouseEvent, node: any) => {
    const personData = rawPersons.find(p => p.id.toString() === node.id);
    if (personData) {
      setSelectedPerson(personData);
    }
  };

  return (
    <div className="w-full h-[calc(100vh-64px)]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background gap={12} size={1} />
      </ReactFlow>
      
      <PersonDetailModal 
        isOpen={!!selectedPerson} 
        onClose={() => setSelectedPerson(null)} 
        person={selectedPerson} 
      />
    </div>
  );
}
