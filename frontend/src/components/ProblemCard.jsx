import { useNavigate } from "react-router-dom";
import "../pages/Home.css"

export default function ProblemCard({ problem }) {
    const navigate = useNavigate();
    const colors =
        problem.difficulty === "Easy" ? "34,197,94" :
            problem.difficulty === "Medium" ? "234,179,8" :
                problem.difficulty === "Hard" ? "239,68,68" : "239,68,68";

    function start(e) {
        e.stopPropagation();
        navigate(`/workspace?slug=${problem.slug}&title=${encodeURIComponent(problem.title)}`);
    }
    return (
        <div onClick={start} className="problems_components"
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
        >
            <div className="problem_upper">
                <div className="problemLeft">
                    <div style={{
                        width: 44, height: 44,
                        borderRadius: 11,
                        background: (problem.color) + "18",
                        border: `1.5px solid ${(problem.color)}30`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 22, flexShrink: 0
                    }}>{problem.icon}</div>
                </div>
                <div className="problemRight">
                    <div className='problem_box'>
                        <span className={`badge ${colors}`} style={{ fontSize: 12, background: `rgba(${colors}, 0.2)`, color: `rgba(${colors})`, paddingLeft: 10, paddingRight: 10, paddingTop:3, paddingBottom: 3, borderRadius:7, fontWeight: 700 }}>{problem.difficulty}</span>
                        <span className='problemTime'>⏱ {problem.time} min</span>
                    </div>
                    <h3 className='problemTitle' >{problem.title}</h3>
                </div>
            </div>
            <div className='problem_tag'>
                {problem.tags.map((t) => (
                    <span key={t} className="problem_tags">{t}</span>
                ))}
            </div>
            <div className="designBtn">
                <button className='dbtn' onClick={start}>Start Designing →</button>
            </div>
        </div>
    )
}